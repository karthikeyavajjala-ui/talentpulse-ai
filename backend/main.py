import time
from collections import defaultdict
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
    Request,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import Base, engine, get_db, SessionLocal, active_db_engine_name
from backend.models import (
    User,
    Job,
    JobRequirement,
    Candidate,
    Resume,
    CandidateSkill,
    CandidateEducation,
    CandidateExperience,
    ScreeningResult,
    ScreeningScore,
    RecruiterNote,
)
from backend.schemas import (
    LoginRequest,
    RegisterRequest,
    ExtractJDRequest,
    JobWeights,
    CreateJobRequest,
    CreateNoteRequest,
    UpdateDecisionRequest,
)
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_optional,
)
from backend.nlp.document_parser import parse_resume_document, ResumeParseError, compute_sha256
from backend.nlp.fairness_guard import sanitize_resume_for_fairness, FAIRNESS_DISCLAIMER
from backend.nlp.extractor import extract_candidate_profile, extract_job_requirements
from backend.nlp.matcher import evaluate_candidate_against_job
from backend.seed_demo import (
    seed_demo_database,
    process_and_store_resume,
    recalculate_job_rankings,
    DEMO_CANDIDATE_RESUMES,
)
from backend.exporter import (
    generate_csv_export,
    generate_excel_export,
    generate_pdf_export,
)

# Initialize database tables and demo dataset
Base.metadata.create_all(bind=engine)
with SessionLocal() as startup_db:
    seed_demo_database(startup_db, force_reset=False)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI-Powered Resume Screening & Candidate Intelligence API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory rate limiting for upload/mutation security
RATE_LIMIT_BUCKETS: Dict[str, List[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "local"
    now = time.time()
    window = 60.0
    RATE_LIMIT_BUCKETS[client_ip] = [
        t for t in RATE_LIMIT_BUCKETS[client_ip] if now - t < window
    ]
    if len(RATE_LIMIT_BUCKETS[client_ip]) > 240:
        return Response(
            content='{"detail":"Rate limit exceeded. Please wait a moment and retry."}',
            status_code=429,
            media_type="application/json",
        )
    RATE_LIMIT_BUCKETS[client_ip].append(now)
    return await call_next(request)


def serialize_candidate_summary(c: Candidate) -> Dict[str, Any]:
    sr = c.screening_result
    sb = c.screening_score
    resume = c.resume
    return {
        "id": c.id,
        "job_id": c.job_id,
        "rank": sr.rank_position if sr else 999,
        "full_name": c.full_name,
        "email": c.email,
        "phone": c.phone,
        "location": c.location,
        "current_title": c.current_title,
        "total_experience_years": c.total_experience_years,
        "highest_education": c.highest_education,
        "summary": c.summary,
        "processing_status": c.processing_status,
        "certifications": c.certifications or [],
        "projects": c.projects or [],
        "overall_score": sr.overall_score if sr else 0.0,
        "recommendation": sr.recommendation if sr else "Pending",
        "recruiter_decision": sr.recruiter_decision if sr else "Pending Review",
        "matched_skills": sr.matched_skills if sr else [],
        "missing_skills": sr.missing_skills if sr else [],
        "preferred_matched_skills": sr.preferred_matched_skills if sr else [],
        "explanation_summary": sr.explanation_summary if sr else "",
        "skills_percentage": sb.skills_percentage if sb else 0.0,
        "experience_percentage": sb.experience_percentage if sb else 0.0,
        "education_percentage": sb.education_percentage if sb else 0.0,
        "requirements_percentage": sb.requirements_percentage if sb else 0.0,
        "projects_percentage": sb.projects_percentage if sb else 0.0,
        "score_breakdown": {
            "skills_percentage": sb.skills_percentage if sb else 0.0,
            "experience_percentage": sb.experience_percentage if sb else 0.0,
            "education_percentage": sb.education_percentage if sb else 0.0,
            "requirements_percentage": sb.requirements_percentage if sb else 0.0,
            "projects_percentage": sb.projects_percentage if sb else 0.0,
            "skills_weighted": sb.skills_weighted if sb else 0.0,
            "experience_weighted": sb.experience_weighted if sb else 0.0,
            "education_weighted": sb.education_weighted if sb else 0.0,
            "requirements_weighted": sb.requirements_weighted if sb else 0.0,
            "projects_weighted": sb.projects_weighted if sb else 0.0,
            "skills_max_weight": sb.skills_max_weight if sb else 40.0,
            "experience_max_weight": sb.experience_max_weight if sb else 25.0,
            "education_max_weight": sb.education_max_weight if sb else 15.0,
            "requirements_max_weight": sb.requirements_max_weight if sb else 15.0,
            "projects_max_weight": sb.projects_max_weight if sb else 5.0,
            "semantic_similarity_score": sb.semantic_similarity_score if sb else 0.0,
        },
        "all_skills": [s.skill_name for s in c.skills],
        "resume_file_name": resume.file_name if resume else "resume.pdf",
        "resume_file_type": resume.file_type if resume else "pdf",
        "notes_count": len(c.notes),
        "created_at": c.created_at.isoformat() if c.created_at else "",
    }


def serialize_job(job: Job) -> Dict[str, Any]:
    candidates = job.candidates or []
    scores = [
        c.screening_result.overall_score
        for c in candidates
        if c.screening_result is not None
    ]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    high_matches = sum(1 for s in scores if s >= 80.0)
    shortlisted = sum(
        1
        for c in candidates
        if c.screening_result
        and c.screening_result.recruiter_decision in ("Shortlisted", "Interview Scheduled")
    )
    top_candidate = None
    if candidates:
        sorted_c = sorted(
            candidates,
            key=lambda x: x.screening_result.overall_score if x.screening_result else 0.0,
            reverse=True,
        )
        tc = sorted_c[0]
        top_candidate = {
            "id": tc.id,
            "full_name": tc.full_name,
            "overall_score": tc.screening_result.overall_score if tc.screening_result else 0.0,
        }

    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "min_experience_years": job.min_experience_years,
        "education_level": job.education_level,
        "employment_type": job.employment_type,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "weights": job.weights
        or {
            "skills": 40,
            "experience": 25,
            "education": 15,
            "requirements": 15,
            "projects": 5,
        },
        "status": job.status,
        "is_demo": job.is_demo,
        "candidate_count": len(candidates),
        "average_score": avg_score,
        "high_match_count": high_matches,
        "shortlisted_count": shortlisted,
        "top_candidate": top_candidate,
        "requirements": [
            {
                "id": r.id,
                "category": r.category,
                "requirement_text": r.requirement_text,
                "importance_weight": r.importance_weight,
                "is_mandatory": r.is_mandatory,
            }
            for r in job.requirements
        ],
        "created_at": job.created_at.isoformat() if job.created_at else "",
    }


# ============================================================================
# HEALTH & AUTH ENDPOINTS
# ============================================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_engine": active_db_engine_name,
        "spacy_model": settings.SPACY_MODEL,
        "fairness_guard": settings.FAIRNESS_GUARD_ENABLED,
        "disclaimer": FAIRNESS_DISCLAIMER,
    }


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Try Demo Account: recruiter@talentpulse.ai / Recruiter@2026",
        )
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "company": user.company,
        },
    }


@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(req.password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters long."
        )
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="An account with this email already exists."
        )
    user = User(
        full_name=req.full_name.strip(),
        email=email_clean,
        password_hash=hash_password(req.password),
        role="Senior Recruiter",
        company=req.company or "TalentPulse Enterprise",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "company": user.company,
        },
    }


@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user_optional)):
    if not user:
        raise HTTPException(status_code=404, detail="No user found")
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "company": user.company,
    }


# ============================================================================
# DASHBOARD & DEMO MODE ENDPOINTS
# ============================================================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.id.asc()).all()
    candidates = db.query(Candidate).all()
    results = db.query(ScreeningResult).order_by(ScreeningResult.overall_score.desc()).all()

    scores = [r.overall_score for r in results]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    high_match_count = sum(1 for s in scores if s >= 80.0)
    shortlisted_count = sum(
        1
        for r in results
        if r.recruiter_decision in ("Shortlisted", "Interview Scheduled")
    )

    top_candidates = [
        serialize_candidate_summary(r.candidate)
        for r in results[:6]
        if r.candidate is not None
    ]

    return {
        "total_jobs": len(jobs),
        "total_candidates": len(candidates),
        "average_match_score": avg_score,
        "high_match_count": high_match_count,
        "shortlisted_count": shortlisted_count,
        "processing_status": "All Pipelines Operational (100% Complete)",
        "database_engine": active_db_engine_name,
        "top_candidates": top_candidates,
        "recent_jobs": [serialize_job(j) for j in jobs],
    }


@app.post("/api/demo/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    info = seed_demo_database(db, force_reset=True)
    return {
        "message": "Demo dataset reset and re-processed successfully with 10 realistic resumes.",
        "primary_job_id": info["primary_job_id"],
    }


@app.get("/api/demo/files")
def list_demo_resume_files():
    files = []
    for item in DEMO_CANDIDATE_RESUMES:
        fpath = settings.DEMO_RESUMES_DIR / item["filename"]
        size = fpath.stat().st_size if fpath.exists() else 2048
        files.append(
            {
                "filename": item["filename"],
                "format": item["format"].upper(),
                "size_bytes": size,
            }
        )
    return {"files": files}


# ============================================================================
# JOBS & REQUIREMENT EXTRACTION ENDPOINTS
# ============================================================================

@app.post("/api/jobs/extract-requirements")
def extract_requirements_endpoint(req: ExtractJDRequest):
    if not req.description or len(req.description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Missing or too short Job Description. Please provide at least a sentence describing the role and skills.",
        )
    extracted = extract_job_requirements(req.description, req.title or "")
    return extracted


@app.get("/api/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.id.asc()).all()
    return [serialize_job(j) for j in jobs]


@app.get("/api/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found.")
    return serialize_job(job)


@app.post("/api/jobs")
def create_job(
    req: CreateJobRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    if not req.title or not req.title.strip():
        raise HTTPException(status_code=400, detail="Job title is required.")
    if not req.description or len(req.description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Job Description is required and must be at least 20 characters.",
        )

    extracted = extract_job_requirements(req.description, req.title)
    req_skills = req.required_skills if req.required_skills else extracted["required_skills"]
    pref_skills = req.preferred_skills if req.preferred_skills else extracted["preferred_skills"]

    weights_dict = (
        req.weights.model_dump()
        if req.weights
        else {
            "skills": 40.0,
            "experience": 25.0,
            "education": 15.0,
            "requirements": 15.0,
            "projects": 5.0,
        }
    )

    job = Job(
        user_id=user.id if user else None,
        title=req.title.strip(),
        department=req.department.strip() or extracted["department"],
        location=req.location.strip() or extracted["location"],
        min_experience_years=req.min_experience_years,
        education_level=req.education_level or extracted["education_level"],
        employment_type=req.employment_type or "Full-Time",
        description=req.description.strip(),
        required_skills=req_skills,
        preferred_skills=pref_skills,
        weights=weights_dict,
        status="Active",
        is_demo=False,
    )
    db.add(job)
    db.flush()

    for req_item in extracted["requirements"]:
        db.add(
            JobRequirement(
                job_id=job.id,
                category=req_item["category"],
                requirement_text=req_item["requirement_text"],
                importance_weight=req_item["importance_weight"],
                is_mandatory=req_item["is_mandatory"],
            )
        )

    db.commit()
    db.refresh(job)
    return serialize_job(job)


@app.put("/api/jobs/{job_id}/weights")
def update_job_weights_and_rescore(
    job_id: int, weights: JobWeights, db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    w_dict = weights.model_dump()
    total_w = sum(w_dict.values())
    if total_w <= 0:
        raise HTTPException(
            status_code=400, detail="Total scoring weights must be greater than 0."
        )

    job.weights = w_dict
    db.flush()

    job_data = {
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "min_experience_years": job.min_experience_years,
        "education_level": job.education_level,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "weights": w_dict,
        "requirements": [
            {
                "category": r.category,
                "requirement_text": r.requirement_text,
                "importance_weight": r.importance_weight,
                "is_mandatory": r.is_mandatory,
            }
            for r in job.requirements
        ],
    }

    for cand in job.candidates:
        sanitized_text = cand.resume.sanitized_text if cand.resume else (cand.summary or "")
        profile = {
            "full_name": cand.full_name,
            "email": cand.email,
            "phone": cand.phone,
            "location": cand.location,
            "current_title": cand.current_title,
            "total_experience_years": cand.total_experience_years,
            "highest_education": cand.highest_education,
            "summary": cand.summary,
            "skills": [
                {
                    "skill_name": s.skill_name,
                    "normalized_name": s.normalized_name,
                    "category": s.category,
                    "proficiency_hint": s.proficiency_hint,
                }
                for s in cand.skills
            ],
            "education": [
                {
                    "degree": e.degree,
                    "field_of_study": e.field_of_study,
                    "institution": e.institution,
                    "graduation_year": e.graduation_year,
                }
                for e in cand.education
            ],
            "experience": [
                {
                    "job_title": ex.job_title,
                    "company": ex.company,
                    "duration": ex.duration,
                    "years": ex.years,
                    "description": ex.description,
                }
                for ex in cand.experience
            ],
            "certifications": cand.certifications or [],
            "projects": cand.projects or [],
        }
        audit = (
            cand.screening_result.fairness_audit
            if cand.screening_result
            else {"fairness_guard_active": True}
        )
        eval_res = evaluate_candidate_against_job(
            profile, sanitized_text, job_data, audit
        )

        if cand.screening_result:
            sr = cand.screening_result
            sr.overall_score = eval_res["overall_score"]
            sr.recommendation = eval_res["recommendation"]
            sr.explanation_summary = eval_res["explanation_summary"]
            if cand.screening_score:
                sb = eval_res["score_breakdown"]
                sc = cand.screening_score
                sc.skills_percentage = sb["skills_percentage"]
                sc.experience_percentage = sb["experience_percentage"]
                sc.education_percentage = sb["education_percentage"]
                sc.requirements_percentage = sb["requirements_percentage"]
                sc.projects_percentage = sb["projects_percentage"]
                sc.skills_weighted = sb["skills_weighted"]
                sc.experience_weighted = sb["experience_weighted"]
                sc.education_weighted = sb["education_weighted"]
                sc.requirements_weighted = sb["requirements_weighted"]
                sc.projects_weighted = sb["projects_weighted"]
                sc.skills_max_weight = sb["skills_max_weight"]
                sc.experience_max_weight = sb["experience_max_weight"]
                sc.education_max_weight = sb["education_max_weight"]
                sc.requirements_max_weight = sb["requirements_max_weight"]
                sc.projects_max_weight = sb["projects_max_weight"]

    recalculate_job_rankings(db, job.id)
    db.refresh(job)
    return serialize_job(job)


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    db.delete(job)
    db.commit()
    return {"message": f"Job '{job.title}' deleted successfully."}


# ============================================================================
# RESUME UPLOAD & BATCH PROCESSING ENDPOINTS
# ============================================================================

@app.post("/api/jobs/{job_id}/resumes")
async def upload_resumes(
    job_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job opening #{job_id} not found.")
    if not job.description or len(job.description.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Missing Job Description on this job opening. Please add a JD before screening resumes.",
        )
    if not files:
        raise HTTPException(
            status_code=400, detail="No files provided for upload."
        )

    processed_results = []
    errors = []

    for upload in files:
        fname = upload.filename or "unnamed_resume"
        try:
            content = await upload.read()
            raw_text, ext, file_hash = parse_resume_document(fname, content)

            # Duplicate check within the same job opening
            existing_resume = (
                db.query(Resume)
                .filter(Resume.job_id == job_id, Resume.file_hash == file_hash)
                .first()
            )
            if existing_resume:
                errors.append(
                    {
                        "filename": fname,
                        "error_code": "DUPLICATE_RESUME",
                        "message": f"Duplicate resume detected: '{fname}' matches already processed candidate '{existing_resume.candidate.full_name}'.",
                    }
                )
                continue

            # Save uploaded file to disk
            safe_name = f"job{job_id}_{int(time.time() * 1000)}_{Path(fname).name}"
            save_path = settings.UPLOAD_DIR / safe_name
            save_path.write_bytes(content)

            candidate = process_and_store_resume(
                db=db,
                job=job,
                filename=fname,
                file_bytes=content,
                saved_path=str(save_path),
            )
            db.commit()
            db.refresh(candidate)
            processed_results.append(serialize_candidate_summary(candidate))

        except ResumeParseError as rpe:
            db.rollback()
            errors.append(
                {
                    "filename": fname,
                    "error_code": rpe.error_code,
                    "message": rpe.message,
                }
            )
        except Exception as exc:
            db.rollback()
            errors.append(
                {
                    "filename": fname,
                    "error_code": "AI_PROCESSING_FAILURE",
                    "message": f"Failed to process '{fname}': {str(exc)}",
                }
            )

    recalculate_job_rankings(db, job.id)

    # Refresh rank positions on newly processed candidates
    updated_processed = []
    for item in processed_results:
        cand = db.query(Candidate).filter(Candidate.id == item["id"]).first()
        if cand:
            updated_processed.append(serialize_candidate_summary(cand))

    return {
        "job_id": job.id,
        "processed_count": len(updated_processed),
        "error_count": len(errors),
        "processed_candidates": updated_processed,
        "errors": errors,
    }


@app.post("/api/jobs/{job_id}/load-demo-resumes")
def load_demo_resumes_into_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    added = 0
    skipped = 0
    for item in DEMO_CANDIDATE_RESUMES:
        fpath = settings.DEMO_RESUMES_DIR / item["filename"]
        if not fpath.exists():
            continue
        file_bytes = fpath.read_bytes()
        _, _, file_hash = parse_resume_document(item["filename"], file_bytes)
        exists = (
            db.query(Resume)
            .filter(Resume.job_id == job.id, Resume.file_hash == file_hash)
            .first()
        )
        if exists:
            skipped += 1
            continue
        process_and_store_resume(
            db=db,
            job=job,
            filename=item["filename"],
            file_bytes=file_bytes,
            recruiter_decision=item["recruiter_decision"],
            initial_note=item["initial_note"],
            rating=item["rating"],
            saved_path=str(fpath),
        )
        added += 1

    recalculate_job_rankings(db, job.id)
    return {
        "message": f"Processed {added} sample resumes ({skipped} duplicates skipped).",
        "added_count": added,
        "skipped_count": skipped,
    }


# ============================================================================
# CANDIDATE RESULTS, FILTERING, SORTING & DETAIL ENDPOINTS
# ============================================================================

@app.get("/api/jobs/{job_id}/candidates")
def get_job_candidates(
    job_id: int,
    search: Optional[str] = Query(default=None),
    min_score: Optional[float] = Query(default=None),
    max_score: Optional[float] = Query(default=None),
    skill: Optional[str] = Query(default=None),
    min_experience: Optional[float] = Query(default=None),
    education: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    certification: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None),
    recommendation: Optional[str] = Query(default=None),
    sort_by: Optional[str] = Query(default="highest_match"),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    candidates = [serialize_candidate_summary(c) for c in job.candidates]

    # Filtering
    if search and search.strip():
        q = search.strip().lower()
        candidates = [
            c
            for c in candidates
            if q in c["full_name"].lower()
            or q in (c["email"] or "").lower()
            or q in (c["location"] or "").lower()
            or q in (c["current_title"] or "").lower()
            or any(q in sk.lower() for sk in c["all_skills"])
        ]

    if min_score is not None:
        candidates = [c for c in candidates if c["overall_score"] >= min_score]
    if max_score is not None:
        candidates = [c for c in candidates if c["overall_score"] <= max_score]

    if skill and skill.strip():
        sk_q = skill.strip().lower()
        candidates = [
            c
            for c in candidates
            if any(sk_q in s.lower() for s in c["all_skills"])
        ]

    if min_experience is not None:
        candidates = [
            c for c in candidates if c["total_experience_years"] >= min_experience
        ]

    if education and education.strip() and education.lower() != "all":
        edu_q = education.strip().lower()
        candidates = [
            c
            for c in candidates
            if edu_q in (c["highest_education"] or "").lower()
        ]

    if location and location.strip() and location.lower() != "all":
        loc_q = location.strip().lower()
        candidates = [
            c for c in candidates if loc_q in (c["location"] or "").lower()
        ]

    if certification and certification.strip():
        cert_q = certification.strip().lower()
        candidates = [
            c
            for c in candidates
            if any(cert_q in cert.lower() for cert in c["certifications"])
        ]

    if status_filter and status_filter.strip() and status_filter.lower() != "all":
        sf = status_filter.strip().lower()
        candidates = [
            c
            for c in candidates
            if sf in c["processing_status"].lower()
            or sf in c["recruiter_decision"].lower()
        ]

    if recommendation and recommendation.strip() and recommendation.lower() != "all":
        rec_q = recommendation.strip().lower()
        candidates = [
            c for c in candidates if rec_q in c["recommendation"].lower()
        ]

    # Sorting
    if sort_by == "lowest_match":
        candidates.sort(key=lambda x: x["overall_score"])
    elif sort_by == "most_experience":
        candidates.sort(key=lambda x: x["total_experience_years"], reverse=True)
    elif sort_by == "most_skills":
        candidates.sort(key=lambda x: len(x["all_skills"]), reverse=True)
    elif sort_by == "recently_processed":
        candidates.sort(key=lambda x: x["id"], reverse=True)
    else:  # highest_match (default)
        candidates.sort(key=lambda x: (x["overall_score"], -x["rank"]), reverse=True)

    return {
        "job": serialize_job(job),
        "total": len(candidates),
        "candidates": candidates,
    }


@app.get("/api/candidates/{candidate_id}")
def get_candidate_detail(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    base = serialize_candidate_summary(cand)
    sr = cand.screening_result
    resume = cand.resume

    base.update(
        {
            "job_title": cand.job.title if cand.job else "",
            "job_required_skills": cand.job.required_skills if cand.job else [],
            "job_preferred_skills": cand.job.preferred_skills if cand.job else [],
            "job_min_experience_years": cand.job.min_experience_years if cand.job else 0.0,
            "job_education_level": cand.job.education_level if cand.job else "Bachelor's",
            "skills_detailed": [
                {
                    "id": s.id,
                    "skill_name": s.skill_name,
                    "category": s.category,
                    "proficiency_hint": s.proficiency_hint,
                    "is_matched": s.is_matched,
                    "match_type": s.match_type,
                    "similarity_score": s.similarity_score,
                }
                for s in cand.skills
            ],
            "education_detailed": [
                {
                    "id": e.id,
                    "degree": e.degree,
                    "field_of_study": e.field_of_study,
                    "institution": e.institution,
                    "graduation_year": e.graduation_year,
                    "gpa_or_honors": e.gpa_or_honors,
                }
                for e in cand.education
            ],
            "experience_detailed": [
                {
                    "id": ex.id,
                    "job_title": ex.job_title,
                    "company": ex.company,
                    "duration": ex.duration,
                    "years": ex.years,
                    "description": ex.description,
                    "relevance_score": ex.relevance_score,
                }
                for ex in cand.experience
            ],
            "strengths": sr.strengths if sr else [],
            "potential_gaps": sr.potential_gaps if sr else [],
            "requirement_comparisons": sr.requirement_comparisons if sr else [],
            "semantic_highlights": sr.semantic_highlights if sr else [],
            "fairness_audit": sr.fairness_audit if sr else {},
            "resume_raw_text": resume.raw_text if resume else "",
            "resume_file_size_bytes": resume.file_size_bytes if resume else 0,
            "notes": [
                {
                    "id": n.id,
                    "author_name": n.author_name,
                    "note_text": n.note_text,
                    "decision_status": n.decision_status,
                    "rating": n.rating,
                    "created_at": n.created_at.isoformat() if n.created_at else "",
                }
                for n in cand.notes
            ],
        }
    )
    return base


@app.get("/api/candidates/{candidate_id}/analysis")
def get_candidate_analysis(candidate_id: int, db: Session = Depends(get_db)):
    detail = get_candidate_detail(candidate_id, db)
    return {
        "candidate_id": detail["id"],
        "full_name": detail["full_name"],
        "rank": detail["rank"],
        "overall_score": detail["overall_score"],
        "recommendation": detail["recommendation"],
        "recruiter_decision": detail["recruiter_decision"],
        "score_breakdown": detail["score_breakdown"],
        "matched_skills": detail["matched_skills"],
        "missing_skills": detail["missing_skills"],
        "preferred_matched_skills": detail["preferred_matched_skills"],
        "strengths": detail["strengths"],
        "potential_gaps": detail["potential_gaps"],
        "requirement_comparisons": detail["requirement_comparisons"],
        "semantic_highlights": detail["semantic_highlights"],
        "explanation_summary": detail["explanation_summary"],
        "fairness_audit": detail["fairness_audit"],
    }


@app.post("/api/candidates/{candidate_id}/notes")
def add_candidate_note(
    candidate_id: int, req: CreateNoteRequest, db: Session = Depends(get_db)
):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    if not req.note_text or not req.note_text.strip():
        raise HTTPException(status_code=400, detail="Note text cannot be empty.")

    decision = req.decision_status or (
        cand.screening_result.recruiter_decision
        if cand.screening_result
        else "Pending Review"
    )
    if req.decision_status and cand.screening_result:
        cand.screening_result.recruiter_decision = req.decision_status

    note = RecruiterNote(
        candidate_id=cand.id,
        author_name=req.author_name or "Aarav Menon (Lead Technical Recruiter)",
        note_text=req.note_text.strip(),
        decision_status=decision,
        rating=req.rating or 5,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "candidate_id": cand.id,
        "author_name": note.author_name,
        "note_text": note.note_text,
        "decision_status": note.decision_status,
        "rating": note.rating,
        "created_at": note.created_at.isoformat() if note.created_at else "",
    }


@app.patch("/api/candidates/{candidate_id}/status")
def update_candidate_decision(
    candidate_id: int, req: UpdateDecisionRequest, db: Session = Depends(get_db)
):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand or not cand.screening_result:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    cand.screening_result.recruiter_decision = req.recruiter_decision
    db.commit()
    return {
        "candidate_id": cand.id,
        "recruiter_decision": cand.screening_result.recruiter_decision,
    }


@app.delete("/api/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    job_id = cand.job_id
    name = cand.full_name
    db.delete(cand)
    db.commit()
    recalculate_job_rankings(db, job_id)
    return {"message": f"Candidate '{name}' removed and rankings updated."}


@app.get("/api/candidates/{candidate_id}/resume/download")
def download_candidate_resume(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand or not cand.resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    resume = cand.resume
    if resume.file_path and Path(resume.file_path).exists():
        media_map = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "txt": "text/plain; charset=utf-8",
        }
        return FileResponse(
            path=resume.file_path,
            filename=resume.file_name,
            media_type=media_map.get(resume.file_type, "application/octet-stream"),
        )

    # Fallback to raw text download
    return Response(
        content=resume.raw_text.encode("utf-8"),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{cand.full_name.replace(" ", "_")}_Resume.txt"'
        },
    )


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/api/jobs/{job_id}/analytics")
def get_job_analytics(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    candidates = [serialize_candidate_summary(c) for c in job.candidates]
    total = len(candidates)

    highly_matched = sum(1 for c in candidates if c["overall_score"] >= 80.0)
    moderately_matched = sum(
        1 for c in candidates if 60.0 <= c["overall_score"] < 80.0
    )
    low_matched = sum(1 for c in candidates if c["overall_score"] < 60.0)

    # 1. Score distribution buckets
    score_buckets = [
        {"range": "90-100%", "count": sum(1 for c in candidates if c["overall_score"] >= 90)},
        {"range": "80-89%", "count": sum(1 for c in candidates if 80 <= c["overall_score"] < 90)},
        {"range": "70-79%", "count": sum(1 for c in candidates if 70 <= c["overall_score"] < 80)},
        {"range": "60-69%", "count": sum(1 for c in candidates if 60 <= c["overall_score"] < 70)},
        {"range": "<60%", "count": sum(1 for c in candidates if c["overall_score"] < 60)},
    ]

    # 2. Skill coverage across required skills
    req_skills = job.required_skills or []
    skill_coverage = []
    for sk in req_skills:
        matched_cnt = sum(
            1 for c in candidates if sk.lower() in [m.lower() for m in c["matched_skills"]]
        )
        pct = round((matched_cnt / total) * 100.0, 1) if total > 0 else 0.0
        skill_coverage.append(
            {
                "skill": sk,
                "matched_candidates": matched_cnt,
                "coverage_pct": pct,
            }
        )

    # 3. Experience distribution
    exp_distribution = [
        {"bracket": "0-2 yrs", "count": sum(1 for c in candidates if c["total_experience_years"] <= 2.5)},
        {"bracket": "3-4 yrs", "count": sum(1 for c in candidates if 2.5 < c["total_experience_years"] <= 4.5)},
        {"bracket": "5-6 yrs", "count": sum(1 for c in candidates if 4.5 < c["total_experience_years"] <= 6.0)},
        {"bracket": "6+ yrs", "count": sum(1 for c in candidates if c["total_experience_years"] > 6.0)},
    ]

    # 4. Education distribution
    edu_counts: Dict[str, int] = defaultdict(int)
    for c in candidates:
        edu_counts[c["highest_education"] or "Bachelor's"] += 1
    education_distribution = [
        {"education": k, "count": v} for k, v in sorted(edu_counts.items(), key=lambda x: -x[1])
    ]

    # 5. Top matched skills frequency
    matched_freq: Dict[str, int] = defaultdict(int)
    for c in candidates:
        for sk in c["matched_skills"] + c["preferred_matched_skills"]:
            matched_freq[sk] += 1
    top_matched_skills = [
        {"skill": k, "count": v}
        for k, v in sorted(matched_freq.items(), key=lambda x: -x[1])[:10]
    ]

    # 6. Missing skill frequency
    missing_freq: Dict[str, int] = defaultdict(int)
    for c in candidates:
        for sk in c["missing_skills"]:
            missing_freq[sk] += 1
    missing_skill_frequency = [
        {"skill": k, "count": v}
        for k, v in sorted(missing_freq.items(), key=lambda x: -x[1])[:10]
    ]

    return {
        "job": serialize_job(job),
        "total_candidates": total,
        "highly_matched": highly_matched,
        "moderately_matched": moderately_matched,
        "low_matched": low_matched,
        "average_score": (
            round(sum(c["overall_score"] for c in candidates) / total, 1)
            if total > 0
            else 0.0
        ),
        "score_distribution": score_buckets,
        "skill_coverage": skill_coverage,
        "experience_distribution": exp_distribution,
        "education_distribution": education_distribution,
        "top_matched_skills": top_matched_skills,
        "missing_skill_frequency": missing_skill_frequency,
    }


# ============================================================================
# EXPORT ENDPOINT (CSV, EXCEL, PDF)
# ============================================================================

@app.get("/api/jobs/{job_id}/export")
def export_screening_results(
    job_id: int,
    format: str = Query(default="csv", description="Export format: csv, excel, or pdf"),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job_info = serialize_job(job)
    candidates_sorted = sorted(
        job.candidates,
        key=lambda c: c.screening_result.overall_score if c.screening_result else 0.0,
        reverse=True,
    )

    rows = []
    for c in candidates_sorted:
        summary = serialize_candidate_summary(c)
        summary["recruiter_notes"] = [
            f"{n.author_name}: {n.note_text}" for n in c.notes
        ]
        rows.append(summary)

    fmt = format.lower().strip()
    slug = job.title.lower().replace(" ", "_")[:30]

    if fmt == "csv":
        data = generate_csv_export(job_info, rows)
        return Response(
            content=data,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="screening_results_{slug}.csv"'
            },
        )
    elif fmt in ("excel", "xlsx"):
        data = generate_excel_export(job_info, rows)
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="screening_results_{slug}.xlsx"'
            },
        )
    elif fmt == "pdf":
        data = generate_pdf_export(job_info, rows)
        return Response(
            content=data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="screening_report_{slug}.pdf"'
            },
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported export format. Choose 'csv', 'excel', or 'pdf'.",
        )
