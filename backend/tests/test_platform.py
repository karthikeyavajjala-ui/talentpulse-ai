import io
from fastapi.testclient import TestClient
from backend.main import app
from backend.nlp.fairness_guard import sanitize_resume_for_fairness
from backend.nlp.matcher import compute_sentence_semantic_similarity

client = TestClient(app)


def test_health_and_fairness_disclaimer():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["fairness_guard"] is True
    assert (
        data["disclaimer"]
        == "AI-generated screening results are decision-support information only. Recruiters must review candidates and make final decisions."
    )


def test_fairness_guard_redacts_protected_characteristics():
    sample_text = (
        "Name: Test Candidate\n"
        "Gender: Female | Marital Status: Married | Age: 29 years | DOB: 12/05/1997\n"
        "Religion: Hindu | Caste: General | Category: OBC\n"
        "Skills: Python, SQL, Machine Learning, Pandas, Docker"
    )
    sanitized, audit = sanitize_resume_for_fairness(sample_text)
    assert audit["fairness_guard_active"] is True
    assert audit["protected_attributes_used_in_scoring"] is False
    assert audit["redacted_attribute_count"] >= 4
    assert "Marital Status: Married" not in sanitized


def test_semantic_similarity_beyond_exact_keywords():
    jd_phrase = "Machine Learning Engineer"
    resume_phrase = "Built predictive models using scikit-learn and TensorFlow"
    sim = compute_sentence_semantic_similarity(jd_phrase, resume_phrase)
    assert sim >= 0.65, f"Expected high semantic similarity, got {sim}"


def test_demo_dataset_and_ranking():
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_jobs"] >= 2
    assert stats["total_candidates"] >= 10

    cands_res = client.get("/api/jobs/1/candidates")
    assert cands_res.status_code == 200
    cands = cands_res.json()["candidates"]
    assert len(cands) == 10
    # Verify #1 ranked candidate is Rahul Kumar with matched Python, SQL, Machine Learning, Pandas and missing Docker
    top = cands[0]
    assert top["rank"] == 1
    assert top["full_name"] == "Rahul Kumar"
    assert "Python" in top["matched_skills"]
    assert "SQL" in top["matched_skills"]
    assert "Machine Learning" in top["matched_skills"]
    assert "Pandas" in top["matched_skills"]
    assert "Docker" in top["missing_skills"]


def test_jd_requirement_auto_extraction_and_job_creation():
    ext_res = client.post(
        "/api/jobs/extract-requirements",
        json={
            "title": "AI Platform Engineer",
            "description": "Looking for 4+ years experience in Python, FastAPI, Docker, Kubernetes, PostgreSQL, and Machine Learning. M.Tech preferred.",
        },
    )
    assert ext_res.status_code == 200
    extracted = ext_res.json()
    assert "Python" in extracted["required_skills"]
    assert "Docker" in extracted["required_skills"]

    job_res = client.post(
        "/api/jobs",
        json={
            "title": "AI Platform Engineer",
            "department": "AI Infrastructure",
            "location": "Bengaluru, India",
            "min_experience_years": 4.0,
            "education_level": "Bachelor's",
            "employment_type": "Full-Time",
            "description": "Looking for 4+ years experience in Python, FastAPI, Docker, Kubernetes, PostgreSQL, and Machine Learning.",
            "required_skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "Machine Learning"],
            "preferred_skills": ["Kubernetes", "AWS"],
            "weights": {
                "skills": 40,
                "experience": 25,
                "education": 15,
                "requirements": 15,
                "projects": 5,
            },
        },
    )
    assert job_res.status_code == 200
    new_job = job_res.json()
    job_id = new_job["id"]

    # Test uploading valid TXT resume + invalid file + empty file + duplicate resume
    valid_resume_bytes = b"""KARTHIK SUBRAMANIAN
Email: karthik.s@cloudai.in | Phone: +91 98400 12345 | Location: Chennai, India
Current Role: Senior AI Platform Engineer
SUMMARY
Senior AI Platform Engineer with 5 years of experience building Python, FastAPI, Docker, Kubernetes, PostgreSQL, and Machine Learning services on AWS.
EDUCATION
B.Tech in Computer Science | IIT Madras | 2021
SKILLS
Python, FastAPI, Docker, Kubernetes, PostgreSQL, SQL, Machine Learning, AWS
"""
    upload_res = client.post(
        f"/api/jobs/{job_id}/resumes",
        files=[
            ("files", ("Karthik_Resume.txt", io.BytesIO(valid_resume_bytes), "text/plain")),
            ("files", ("Empty_Resume.txt", io.BytesIO(b""), "text/plain")),
            ("files", ("Invalid_Format.exe", io.BytesIO(b"binarydata"), "application/octet-stream")),
            ("files", ("Duplicate_Karthik.txt", io.BytesIO(valid_resume_bytes), "text/plain")),
        ],
    )
    assert upload_res.status_code == 200
    up_data = upload_res.json()
    assert up_data["processed_count"] == 1
    assert up_data["error_count"] == 3
    error_codes = {e["error_code"] for e in up_data["errors"]}
    assert "EMPTY_FILE" in error_codes
    assert "UNSUPPORTED_FORMAT" in error_codes
    assert "DUPLICATE_RESUME" in error_codes

    # Clean up test job
    client.delete(f"/api/jobs/{job_id}")


def test_candidate_detail_notes_analytics_and_exports():
    detail_res = client.get("/api/candidates/1")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["full_name"] == "Rahul Kumar"
    assert len(detail["strengths"]) >= 1
    assert len(detail["requirement_comparisons"]) >= 1

    # Add recruiter note
    note_res = client.post(
        "/api/candidates/1/notes",
        json={
            "note_text": "Verified strong system design and ML modeling depth.",
            "decision_status": "Shortlisted",
            "rating": 5,
        },
    )
    assert note_res.status_code == 200

    # Analytics
    ana_res = client.get("/api/jobs/1/analytics")
    assert ana_res.status_code == 200
    ana = ana_res.json()
    assert ana["total_candidates"] == 10
    assert len(ana["score_distribution"]) == 5

    # Exports: CSV, Excel, PDF
    for fmt in ("csv", "excel", "pdf"):
        exp_res = client.get(f"/api/jobs/1/export?format={fmt}")
        assert exp_res.status_code == 200
        assert len(exp_res.content) > 500
