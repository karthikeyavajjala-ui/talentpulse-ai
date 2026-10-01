from functools import lru_cache
import re
from typing import Dict, List, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.nlp.extractor import nlp, SKILL_ONTOLOGY

# Semantic skill adjacency map: skills that are closely related conceptually
SEMANTIC_SKILL_NEIGHBORS: Dict[str, List[Tuple[str, float]]] = {
    "Machine Learning": [
        ("Scikit-Learn", 0.92),
        ("TensorFlow", 0.88),
        ("PyTorch", 0.88),
        ("XGBoost", 0.90),
        ("Deep Learning", 0.86),
        ("NLP", 0.82),
    ],
    "Deep Learning": [
        ("PyTorch", 0.92),
        ("TensorFlow", 0.92),
        ("Hugging Face", 0.85),
        ("LLMs & GenAI", 0.85),
        ("Computer Vision", 0.84),
        ("Machine Learning", 0.84),
    ],
    "NLP": [
        ("spaCy", 0.92),
        ("Hugging Face", 0.90),
        ("LLMs & GenAI", 0.90),
        ("LangChain", 0.85),
        ("Deep Learning", 0.80),
    ],
    "LLMs & GenAI": [
        ("Hugging Face", 0.92),
        ("LangChain", 0.92),
        ("NLP", 0.88),
        ("PyTorch", 0.82),
    ],
    "Pandas": [("NumPy", 0.88), ("Python", 0.80), ("Apache Spark", 0.76)],
    "NumPy": [("Pandas", 0.88), ("Scikit-Learn", 0.80)],
    "Scikit-Learn": [("Machine Learning", 0.92), ("XGBoost", 0.86), ("Pandas", 0.78)],
    "TensorFlow": [("PyTorch", 0.86), ("Deep Learning", 0.90), ("Machine Learning", 0.86)],
    "PyTorch": [("TensorFlow", 0.86), ("Deep Learning", 0.90), ("Hugging Face", 0.84)],
    "SQL": [("PostgreSQL", 0.94), ("Snowflake", 0.85), ("ETL Pipelines", 0.78)],
    "PostgreSQL": [("SQL", 0.94), ("Redis", 0.72), ("MongoDB", 0.70)],
    "Docker": [("Kubernetes", 0.86), ("CI/CD", 0.78), ("MLOps", 0.76), ("AWS", 0.72)],
    "Kubernetes": [("Docker", 0.88), ("AWS", 0.78), ("Terraform", 0.76)],
    "FastAPI": [("Flask", 0.86), ("Django", 0.82), ("REST APIs", 0.90), ("Python", 0.80)],
    "REST APIs": [("FastAPI", 0.90), ("Flask", 0.86), ("Django", 0.84), ("Node.js", 0.80), ("GraphQL", 0.80)],
    "AWS": [("GCP", 0.82), ("Azure", 0.82), ("Docker", 0.75), ("MLOps", 0.76)],
    "MLOps": [("Docker", 0.82), ("Kubernetes", 0.80), ("CI/CD", 0.82), ("AWS", 0.78)],
}

DEGREE_RANK_MAP = {
    "Ph.D.": 5,
    "M.Tech": 4,
    "M.S. / M.Sc.": 4,
    "MBA": 4,
    "MCA": 4,
    "Master's": 4,
    "B.Tech": 3,
    "B.E.": 3,
    "B.S. / B.Sc.": 3,
    "BCA": 3,
    "Bachelor's": 3,
}


STOP_WORDS = {
    "the", "and", "for", "with", "using", "from", "that", "this", "into",
    "have", "has", "had", "are", "was", "were", "will", "would", "could",
    "should", "over", "across", "such", "their", "our", "your", "you",
}


@lru_cache(maxsize=4096)
def _get_vector_doc(text: str):
    return nlp.make_doc(text[:900])


@lru_cache(maxsize=4096)
def _get_tokens(text: str) -> frozenset:
    words = re.findall(r"[a-z0-9\+\-#\.]{2,}", text.lower())
    return frozenset(w for w in words if w not in STOP_WORDS)


def compute_sentence_semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Combines spaCy 300-d neural vector cosine similarity with lexical n-gram overlap
    and domain concept expansion for accurate, high-speed semantic matching.
    """
    if not text_a or not text_b or not text_a.strip() or not text_b.strip():
        return 0.0

    # 1. spaCy dense 300-d word vector cosine similarity
    doc_a = _get_vector_doc(text_a)
    doc_b = _get_vector_doc(text_b)
    spacy_sim = 0.0
    if doc_a.vector_norm > 0 and doc_b.vector_norm > 0:
        spacy_sim = float(doc_a.similarity(doc_b))
        spacy_sim = max(0.0, min(1.0, spacy_sim))

    # 2. Lexical token overlap similarity
    toks_a = _get_tokens(text_a)
    toks_b = _get_tokens(text_b)
    lexical_sim = 0.0
    if toks_a and toks_b:
        inter = len(toks_a & toks_b)
        denom = min(len(toks_a), len(toks_b)) ** 0.5 * (max(len(toks_a), len(toks_b)) ** 0.5)
        lexical_sim = inter / max(1.0, denom)

    # 3. Domain concept bridge boost (e.g. "Machine Learning Engineer" <-> "Built predictive models using scikit-learn and TensorFlow")
    domain_boost = 0.0
    la, lb = text_a.lower(), text_b.lower()
    ml_concepts_a = any(w in la for w in ["machine learning", "ml engineer", "predictive", "ai", "model", "data science", "nlp", "deep learning"])
    ml_concepts_b = any(w in lb for w in ["scikit-learn", "tensorflow", "pytorch", "predictive model", "neural network", "xgboost", "random forest", "llm", "transformer", "classification", "regression", "feature engineering"])
    if (ml_concepts_a and ml_concepts_b) or (ml_concepts_b and any(w in la for w in ["scikit-learn", "tensorflow", "pytorch", "model", "algorithm"])):
        domain_boost += 0.14

    api_concepts_a = any(w in la for w in ["api", "microservice", "backend", "production", "deployment", "scalable"])
    api_concepts_b = any(w in lb for w in ["fastapi", "flask", "rest", "docker", "kubernetes", "aws", "latency", "endpoint", "serving"])
    if api_concepts_a and api_concepts_b:
        domain_boost += 0.10

    combined = (0.68 * spacy_sim) + (0.32 * lexical_sim) + domain_boost
    return round(float(min(0.99, max(0.0, combined))), 4)


def split_resume_sentences(sanitized_text: str) -> List[str]:
    raw_lines = [ln.strip(" •-*\t") for ln in sanitized_text.splitlines() if ln.strip()]
    sentences: List[str] = []
    for ln in raw_lines:
        if len(ln) >= 25 and not ln.isupper():
            sentences.append(ln)
    return sentences[:60]


def evaluate_candidate_against_job(
    candidate_profile: Dict[str, Any],
    sanitized_text: str,
    job_data: Dict[str, Any],
    fairness_audit: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Runs the full transparent multi-factor scoring algorithm and produces detailed explanations.
    """
    weights = job_data.get("weights") or {
        "skills": 40,
        "experience": 25,
        "education": 15,
        "requirements": 15,
        "projects": 5,
    }
    w_skills = float(weights.get("skills", 40))
    w_exp = float(weights.get("experience", 25))
    w_edu = float(weights.get("education", 15))
    w_req = float(weights.get("requirements", 15))
    w_proj = float(weights.get("projects", 5))
    total_w = w_skills + w_exp + w_edu + w_req + w_proj
    if total_w <= 0:
        w_skills, w_exp, w_edu, w_req, w_proj = 40.0, 25.0, 15.0, 15.0, 5.0
        total_w = 100.0

    # Normalize weights so they sum to 100
    w_skills = (w_skills / total_w) * 100.0
    w_exp = (w_exp / total_w) * 100.0
    w_edu = (w_edu / total_w) * 100.0
    w_req = (w_req / total_w) * 100.0
    w_proj = (w_proj / total_w) * 100.0

    req_skills: List[str] = job_data.get("required_skills") or []
    pref_skills: List[str] = job_data.get("preferred_skills") or []
    cand_skills_list: List[Dict[str, Any]] = candidate_profile.get("skills") or []
    cand_skill_map: Dict[str, Dict[str, Any]] = {
        s["skill_name"].lower(): s for s in cand_skills_list
    }
    cand_skill_names = [s["skill_name"] for s in cand_skills_list]

    # -------------------------------------------------------------------------
    # 1. SKILLS MATCH (Exact + Synonym + Semantic Neighbors)
    # -------------------------------------------------------------------------
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    preferred_matched_skills: List[str] = []
    skill_credit_sum = 0.0

    for req_sk in req_skills:
        req_lower = req_sk.lower()
        if req_lower in cand_skill_map:
            matched_skills.append(req_sk)
            cand_skill_map[req_lower]["is_matched"] = True
            cand_skill_map[req_lower]["match_type"] = "exact"
            cand_skill_map[req_lower]["similarity_score"] = 1.0
            skill_credit_sum += 1.0
        else:
            # Check semantic skill neighbors
            neighbors = SEMANTIC_SKILL_NEIGHBORS.get(req_sk, [])
            best_neighbor_sim = 0.0
            best_neighbor_name = None
            for nb_name, nb_sim in neighbors:
                if nb_name.lower() in cand_skill_map and nb_sim > best_neighbor_sim:
                    best_neighbor_sim = nb_sim
                    best_neighbor_name = nb_name

            if best_neighbor_sim >= 0.85 and best_neighbor_name:
                # Partial semantic credit, still note if exact tool is missing
                skill_credit_sum += 0.65
                missing_skills.append(req_sk)
                cand_skill_map[best_neighbor_name.lower()]["is_matched"] = True
                if cand_skill_map[best_neighbor_name.lower()].get("match_type") != "exact":
                    cand_skill_map[best_neighbor_name.lower()]["match_type"] = "semantic"
                    cand_skill_map[best_neighbor_name.lower()]["similarity_score"] = best_neighbor_sim
            else:
                missing_skills.append(req_sk)

    for pref_sk in pref_skills:
        pref_lower = pref_sk.lower()
        if pref_lower in cand_skill_map:
            preferred_matched_skills.append(pref_sk)
            cand_skill_map[pref_lower]["is_matched"] = True
            if cand_skill_map[pref_lower].get("match_type") not in ("exact", "semantic"):
                cand_skill_map[pref_lower]["match_type"] = "preferred"
                cand_skill_map[pref_lower]["similarity_score"] = 0.95

    if req_skills:
        base_skill_ratio = skill_credit_sum / len(req_skills)
        pref_bonus = (
            (len(preferred_matched_skills) / max(1, len(pref_skills))) * 0.12
            if pref_skills
            else 0.0
        )
        skills_percentage = min(100.0, round((base_skill_ratio + pref_bonus) * 100.0, 1))
    else:
        skills_percentage = min(100.0, len(cand_skills_list) * 12.0)

    # -------------------------------------------------------------------------
    # 2. EXPERIENCE MATCH (Years + Role Relevance Semantic Similarity)
    # -------------------------------------------------------------------------
    min_exp = float(job_data.get("min_experience_years") or 3.0)
    cand_exp = float(candidate_profile.get("total_experience_years") or 0.0)
    job_title = job_data.get("title") or "Machine Learning Engineer"

    if min_exp <= 0:
        years_score = 95.0
    elif cand_exp >= min_exp:
        # Slight bonus for exceeding minimum experience up to 100%
        over_ratio = min(1.0, (cand_exp - min_exp) / max(2.0, min_exp))
        years_score = 88.0 + (12.0 * over_ratio)
    else:
        years_score = max(20.0, (cand_exp / min_exp) * 85.0)

    # Role relevance similarity
    exp_entries = candidate_profile.get("experience") or []
    role_sims = []
    for exp_item in exp_entries:
        role_text = f"{exp_item.get('job_title', '')} {exp_item.get('description', '')}"
        r_sim = compute_sentence_semantic_similarity(
            f"{job_title} {' '.join(req_skills[:5])}", role_text
        )
        exp_item["relevance_score"] = round(r_sim * 100.0, 1)
        role_sims.append(r_sim)

    best_role_sim = max(role_sims) if role_sims else compute_sentence_semantic_similarity(job_title, sanitized_text[:600])
    experience_percentage = round(min(100.0, (0.65 * years_score) + (0.35 * best_role_sim * 105.0)), 1)

    # -------------------------------------------------------------------------
    # 3. EDUCATION MATCH (Degree Level + Field Relevance)
    # -------------------------------------------------------------------------
    req_edu_label = job_data.get("education_level") or "Bachelor's"
    req_edu_rank = DEGREE_RANK_MAP.get(req_edu_label, 3)
    cand_edu_label = candidate_profile.get("highest_education") or "Bachelor's"
    cand_edu_rank = DEGREE_RANK_MAP.get(cand_edu_label, 3)

    if cand_edu_rank > req_edu_rank:
        edu_base = 96.0
    elif cand_edu_rank == req_edu_rank:
        edu_base = 90.0
    else:
        edu_base = 68.0

    # Check STEM / Computer Science / AI / Data Science field relevance
    edu_text = " ".join(
        f"{e.get('degree', '')} {e.get('field_of_study', '')} {e.get('institution', '')}"
        for e in (candidate_profile.get("education") or [])
    ).lower()
    if any(k in edu_text for k in ["artificial intelligence", "machine learning", "data science", "computer science", "software"]):
        edu_field_bonus = 4.0
    elif any(k in edu_text for k in ["electronics", "electrical", "mathematics", "statistics", "information technology", "engineering"]):
        edu_field_bonus = 0.0
    else:
        edu_field_bonus = -10.0

    education_percentage = round(min(100.0, max(40.0, edu_base + edu_field_bonus)), 1)

    # -------------------------------------------------------------------------
    # 4. JOB REQUIREMENT SEMANTIC MATCH (Requirement-by-Requirement Analysis)
    # -------------------------------------------------------------------------
    resume_sentences = split_resume_sentences(sanitized_text)
    jd_requirements = job_data.get("requirements") or []
    if not jd_requirements:
        # Build default requirement statements from job data
        jd_requirements = [
            {
                "category": "responsibility",
                "requirement_text": f"Hands-on experience as a {job_title} building production systems with {', '.join(req_skills[:3])}.",
                "is_mandatory": True,
            },
            {
                "category": "experience",
                "requirement_text": f"At least {min_exp:g}+ years of relevant industry experience.",
                "is_mandatory": True,
            },
        ]

    requirement_comparisons: List[Dict[str, Any]] = []
    req_sim_scores: List[float] = []

    for req_item in jd_requirements[:10]:
        req_text = req_item.get("requirement_text", "")
        is_mandatory = req_item.get("is_mandatory", True)

        best_sent = ""
        best_sim = 0.0
        for sent in resume_sentences:
            sim = compute_sentence_semantic_similarity(req_text, sent)
            if sim > best_sim:
                best_sim = sim
                best_sent = sent

        # Also boost if skills mentioned in the requirement are matched by the candidate
        req_mentioned_skills = [
            sk for sk in (req_skills + pref_skills) if sk.lower() in req_text.lower()
        ]
        if req_mentioned_skills:
            matched_in_req = [
                sk
                for sk in req_mentioned_skills
                if sk in matched_skills or sk in preferred_matched_skills
            ]
            skill_overlap = len(matched_in_req) / len(req_mentioned_skills)
            best_sim = min(0.98, max(best_sim, (0.45 * best_sim) + (0.55 * skill_overlap)))

        sim_pct = round(best_sim * 100.0, 1)
        if sim_pct >= 78.0:
            status_label = "Matched"
        elif sim_pct >= 62.0:
            status_label = "Semantic Match"
        elif sim_pct >= 45.0:
            status_label = "Partial Match"
        else:
            status_label = "Missing"

        req_sim_scores.append(sim_pct)
        requirement_comparisons.append(
            {
                "requirement": req_text,
                "category": req_item.get("category", "responsibility"),
                "is_mandatory": is_mandatory,
                "status": status_label,
                "similarity_score": sim_pct,
                "evidence": best_sent if sim_pct >= 42.0 else "No direct evidence found in resume.",
            }
        )

    overall_semantic_sim = compute_sentence_semantic_similarity(
        job_data.get("description", ""), sanitized_text
    )
    avg_req_sim = float(np.mean(req_sim_scores)) if req_sim_scores else (overall_semantic_sim * 100.0)
    requirements_percentage = round(
        min(100.0, (0.65 * avg_req_sim) + (0.35 * overall_semantic_sim * 105.0)), 1
    )

    # -------------------------------------------------------------------------
    # 5. CERTIFICATIONS & PROJECTS MATCH
    # -------------------------------------------------------------------------
    certs = candidate_profile.get("certifications") or []
    projects = candidate_profile.get("projects") or []
    proj_score = 45.0
    if projects:
        proj_sims = [
            compute_sentence_semantic_similarity(
                f"{job_title} {' '.join(req_skills)}",
                f"{p.get('title', '')} {p.get('description', '')}",
            )
            for p in projects
        ]
        proj_score += min(38.0, len(projects) * 12.0 + max(proj_sims) * 22.0)
    if certs:
        proj_score += min(22.0, len(certs) * 11.0)
    projects_percentage = round(min(100.0, proj_score), 1)

    # -------------------------------------------------------------------------
    # WEIGHTED SCORE BREAKDOWN
    # -------------------------------------------------------------------------
    skills_weighted = round((skills_percentage / 100.0) * w_skills, 1)
    experience_weighted = round((experience_percentage / 100.0) * w_exp, 1)
    education_weighted = round((education_percentage / 100.0) * w_edu, 1)
    requirements_weighted = round((requirements_percentage / 100.0) * w_req, 1)
    projects_weighted = round((projects_percentage / 100.0) * w_proj, 1)

    overall_score = round(
        min(
            100.0,
            skills_weighted
            + experience_weighted
            + education_weighted
            + requirements_weighted
            + projects_weighted,
        ),
        1,
    )

    if overall_score >= 85.0:
        recommendation = "Strong Match"
    elif overall_score >= 72.0:
        recommendation = "Good Match"
    elif overall_score >= 58.0:
        recommendation = "Moderate Match"
    else:
        recommendation = "Low Match"

    # -------------------------------------------------------------------------
    # SEMANTIC HIGHLIGHTS (Demonstrating non-keyword conceptual matching)
    # -------------------------------------------------------------------------
    semantic_highlights: List[Dict[str, Any]] = []
    jd_probes = [
        f"{job_title} — Building and deploying production machine learning models",
        f"Data processing, feature engineering, and analytics using {', '.join(req_skills[:4])}",
        f"Scalable backend APIs, cloud deployment, and MLOps infrastructure",
    ]
    used_sents = set()
    for probe in jd_probes:
        best_s = ""
        best_sc = 0.0
        for sent in resume_sentences:
            if sent in used_sents:
                continue
            sc = compute_sentence_semantic_similarity(probe, sent)
            if sc > best_sc:
                best_sc = sc
                best_s = sent
        if best_s:
            used_sents.add(best_s)
            semantic_highlights.append(
                {
                    "job_concept": probe,
                    "resume_evidence": best_s,
                    "similarity": round(best_sc * 100.0, 1),
                }
            )

    # -------------------------------------------------------------------------
    # STRENGTHS ("Why this candidate matches") & GAPS ("Potential gaps")
    # -------------------------------------------------------------------------
    strengths: List[str] = []
    if matched_skills:
        strengths.append(
            f"Demonstrates verified proficiency in {len(matched_skills)} of {len(req_skills)} core required skills ({', '.join(matched_skills[:6])})."
        )
    if preferred_matched_skills:
        strengths.append(
            f"Brings bonus preferred skills including {', '.join(preferred_matched_skills[:4])}."
        )
    if cand_exp >= min_exp:
        strengths.append(
            f"Meets or exceeds experience requirement with {cand_exp:g} years of industry experience (requirement: {min_exp:g}+ years)."
        )
    if education_percentage >= 90.0:
        strengths.append(
            f"Strong academic foundation ({cand_edu_label}) aligned with quantitative & engineering requirements."
        )
    if certs or projects:
        strengths.append(
            f"Backed by {len(projects)} relevant technical project(s) and {len(certs)} industry certification(s)."
        )
    if not strengths:
        strengths.append(
            f"Foundational transferable skills in {', '.join(cand_skill_names[:4]) or 'software development'}."
        )

    potential_gaps: List[str] = []
    if missing_skills:
        potential_gaps.append(
            f"Missing explicit resume evidence for required skill(s): {', '.join(missing_skills)}."
        )
    if cand_exp < min_exp:
        gap_yrs = round(min_exp - cand_exp, 1)
        potential_gaps.append(
            f"Total experience ({cand_exp:g} years) is {gap_yrs:g} year(s) below the target {min_exp:g}+ years requirement."
        )
    missing_pref = [p for p in pref_skills if p not in preferred_matched_skills]
    if missing_pref:
        potential_gaps.append(
            f"Could benefit from onboarding or assessment on preferred tools: {', '.join(missing_pref[:4])}."
        )
    if not potential_gaps:
        potential_gaps.append(
            "No major technical gaps detected; recommend probing system design depth and production scale during technical interview."
        )

    explanation_summary = (
        f"{candidate_profile['full_name']} achieved an overall match score of {overall_score:.0f}% ({recommendation}). "
        f"Score breakdown: Skills {skills_weighted:.0f}/{w_skills:.0f} ({skills_percentage:.0f}%), "
        f"Experience {experience_weighted:.0f}/{w_exp:.0f} ({experience_percentage:.0f}%), "
        f"Education {education_weighted:.0f}/{w_edu:.0f} ({education_percentage:.0f}%), "
        f"Requirements {requirements_weighted:.0f}/{w_req:.0f} ({requirements_percentage:.0f}%), "
        f"Projects/Certs {projects_weighted:.0f}/{w_proj:.0f} ({projects_percentage:.0f}%). "
        + (
            f"Matched core skills: {', '.join(matched_skills)}. "
            if matched_skills
            else ""
        )
        + (
            f"Missing core skills: {', '.join(missing_skills)}."
            if missing_skills
            else "All core required skills matched."
        )
    )

    return {
        "overall_score": overall_score,
        "recommendation": recommendation,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "preferred_matched_skills": preferred_matched_skills,
        "strengths": strengths,
        "potential_gaps": potential_gaps,
        "requirement_comparisons": requirement_comparisons,
        "semantic_highlights": semantic_highlights,
        "explanation_summary": explanation_summary,
        "fairness_audit": fairness_audit,
        "score_breakdown": {
            "skills_percentage": skills_percentage,
            "experience_percentage": experience_percentage,
            "education_percentage": education_percentage,
            "requirements_percentage": requirements_percentage,
            "projects_percentage": projects_percentage,
            "skills_weighted": skills_weighted,
            "experience_weighted": experience_weighted,
            "education_weighted": education_weighted,
            "requirements_weighted": requirements_weighted,
            "projects_weighted": projects_weighted,
            "skills_max_weight": round(w_skills, 1),
            "experience_max_weight": round(w_exp, 1),
            "education_max_weight": round(w_edu, 1),
            "requirements_max_weight": round(w_req, 1),
            "projects_max_weight": round(w_proj, 1),
            "semantic_similarity_score": round(overall_semantic_sim * 100.0, 1),
        },
    }
