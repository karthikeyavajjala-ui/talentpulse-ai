import io
from pathlib import Path
from typing import List, Dict, Any
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from backend.config import settings
from backend.auth import hash_password
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
from backend.nlp.document_parser import parse_resume_document
from backend.nlp.fairness_guard import sanitize_resume_for_fairness
from backend.nlp.extractor import extract_candidate_profile, extract_job_requirements
from backend.nlp.matcher import evaluate_candidate_against_job

SAMPLE_JD_TEXT = """Job Title: Senior Machine Learning Engineer
Department: AI & Data Science
Location: Bengaluru, India (Hybrid)
Experience Requirement: 4+ years of industry experience
Education Requirement: B.Tech / M.Tech / M.S. in Computer Science, Data Science, or AI

About the Role:
We are seeking a Senior Machine Learning Engineer to architect, train, and deploy production-grade predictive models, NLP pipelines, and real-time inference services. You will collaborate with product, data engineering, and platform teams to turn large-scale enterprise datasets into high-impact AI products.

Key Responsibilities & Mandatory Requirements:
• 4+ years of professional experience building and deploying Machine Learning models in production environments.
• Strong programming proficiency in Python, SQL, and data manipulation using Pandas and NumPy.
• Hands-on expertise with Scikit-Learn and TensorFlow for supervised/unsupervised predictive modeling and deep learning.
• Experience building low-latency RESTful model serving APIs using FastAPI and containerizing applications with Docker.
• Strong foundation in feature engineering, statistical evaluation, A/B testing, and relational databases (PostgreSQL / SQL).

Preferred Qualifications (Nice to Have):
• Experience with Natural Language Processing (NLP), spaCy, Hugging Face Transformers, or LLMs & GenAI.
• Familiarity with PyTorch, MLOps pipelines (MLflow), AWS cloud services, and Kubernetes orchestration.
• Master's degree (M.Tech / M.S.) or Ph.D. in Computer Science, Artificial Intelligence, or Mathematics.
"""

DEMO_CANDIDATE_RESUMES: List[Dict[str, Any]] = [
    {
        "filename": "01_Rahul_Kumar_Resume.pdf",
        "format": "pdf",
        "recruiter_decision": "Shortlisted",
        "initial_note": "Top-ranked candidate (#1). Strong hands-on ML & Python/SQL/Pandas/TensorFlow/Scikit-Learn/FastAPI engineer. Only missing Docker containerization experience which can be easily ramped up during onboarding.",
        "rating": 5,
        "content": """RAHUL KUMAR
Email: rahul.kumar.ml@techmail.in | Phone: +91 98801 44556 | Location: Bengaluru, India
Current Role: Senior Machine Learning Engineer

SUMMARY
Senior Machine Learning Engineer with 5.5 years of experience designing predictive models, statistical learning systems, and production inference APIs. Deep expertise in Python, SQL, Machine Learning, Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, and FastAPI.

WORK EXPERIENCE
Senior Machine Learning Engineer | QuantEdge Analytics | Mar 2022 - Present
• Built predictive models using Scikit-Learn and TensorFlow to forecast demand and optimize dynamic pricing across 40+ enterprise clients.
• Designed end-to-end feature engineering workflows using Python, SQL, Pandas, NumPy, and PostgreSQL handling 50M+ daily records.
• Exposed low-latency model inference endpoints using FastAPI and REST APIs on AWS cloud infrastructure with MLOps tracking.
• Conducted rigorous A/B testing and statistical hypothesis evaluation to validate model uplift (+18% conversion).

Machine Learning Engineer | NexGen Data Solutions | Jul 2020 - Feb 2022
• Developed NLP text classification and entity extraction pipelines using Python, spaCy, and Hugging Face transformers.
• Built automated SQL and Pandas analytics pipelines and interactive model performance dashboards.

EDUCATION
M.Tech in Computer Science and Data Science | IIT Bombay | 2020 | CGPA: 9.2/10
B.Tech in Computer Science | Delhi Technological University | 2018 | CGPA: 8.8/10

SKILLS
Python, SQL, PostgreSQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, FastAPI, REST APIs, NLP, spaCy, Hugging Face, LLMs & GenAI, AWS, MLOps, A/B Testing, XGBoost

CERTIFICATIONS
• AWS Certified Machine Learning - Specialty
• Google Cloud Certified Professional Machine Learning Engineer
• DeepLearning.AI TensorFlow Developer Certificate

PROJECTS
• Predictive Customer Lifetime Value Engine: Built gradient boosted and deep neural network models in Scikit-Learn and TensorFlow with Pandas preprocessing and FastAPI serving.
• Automated Clinical NLP Extractor: Implemented named entity recognition with spaCy, Hugging Face, and PyTorch.
""",
    },
    {
        "filename": "02_Ananya_Iyer_Resume.pdf",
        "format": "pdf",
        "recruiter_decision": "Shortlisted",
        "initial_note": "Excellent ML & MLOps profile (#2). Strong Docker, FastAPI, Python, SQL, Pandas, and Scikit-Learn experience; primarily uses PyTorch rather than TensorFlow.",
        "rating": 5,
        "content": """ANANYA IYER
Email: ananya.iyer@aimail.in | Phone: +91 98450 11223 | Location: Bengaluru, India
Current Role: Senior Machine Learning Engineer

SUMMARY
Results-driven Senior Machine Learning Engineer with 5.0 years of experience architecting predictive models, NLP pipelines, and scalable MLOps microservices using Python, SQL, Pandas, NumPy, Scikit-Learn, PyTorch, FastAPI, and Docker on AWS and Kubernetes.

WORK EXPERIENCE
Senior Machine Learning Engineer | FinSight AI Labs | Jan 2022 - Present
• Built predictive models using Scikit-Learn and PyTorch for real-time credit risk scoring and fraud detection serving 15M+ users.
• Engineered high-throughput data transformation pipelines in Python, SQL, Pandas, and PostgreSQL, reducing feature latency by 48%.
• Deployed containerized inference microservices using FastAPI, Docker, and Kubernetes on AWS with automated MLflow MLOps monitoring.

Machine Learning Engineer | DataScale Systems | Jun 2020 - Dec 2021
• Developed customer churn classification models and A/B testing experimentation frameworks using Python, Scikit-Learn, XGBoost, and SQL.

EDUCATION
B.Tech in Computer Science and Engineering | NIT Trichy | 2020 | CGPA: 8.9/10

SKILLS
Python, SQL, PostgreSQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, PyTorch, Docker, Kubernetes, FastAPI, REST APIs, NLP, spaCy, MLOps, AWS, A/B Testing, Git

CERTIFICATIONS
• AWS Certified Machine Learning - Specialty

PROJECTS
• Real-Time Fraud Detection Engine: Built ensemble models with Scikit-Learn and XGBoost served via FastAPI and Docker containers.
""",
    },
    {
        "filename": "03_Priya_Sharma_Resume.docx",
        "format": "docx",
        "recruiter_decision": "Interview Scheduled",
        "initial_note": "Very strong NLP & Deep Learning specialist. Great Python, SQL, Pandas, Scikit-Learn, Docker, and FastAPI skills.",
        "rating": 5,
        "content": """PRIYA SHARMA
Email: priya.sharma.ai@datamail.in | Phone: +91 97312 88990 | Location: Hyderabad, India
Current Role: Lead Data Scientist & ML Engineer

SUMMARY
Machine Learning Engineer and Data Scientist with 5 years of experience building production ML systems, NLP models, and containerized FastAPI microservices. Proficient in Python, SQL, Machine Learning, Pandas, Scikit-Learn, PyTorch, Docker, and AWS.

WORK EXPERIENCE
Lead Machine Learning Engineer | CloudPulse AI | Feb 2023 - Present
• Architected predictive modeling pipelines using Python, Scikit-Learn, PyTorch, and Pandas for enterprise SaaS analytics.
• Built and deployed RESTful inference services using FastAPI, Docker, and Kubernetes on AWS.
• Designed complex SQL and PostgreSQL feature stores and automated A/B testing pipelines.

Data Scientist | InsightWorks India | Jul 2021 - Jan 2023
• Built NLP sentiment and intent classification models using spaCy, Hugging Face, and LLMs & GenAI.
• Created scalable ETL data processing scripts with Python, Pandas, NumPy, and SQL.

EDUCATION
M.S. in Data Science and Machine Learning | IIIT Hyderabad | 2021 | CGPA: 8.9/10
B.Tech in Information Technology | Anna University, Chennai | 2019 | CGPA: 8.6/10

SKILLS
Python, SQL, PostgreSQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, PyTorch, Docker, Kubernetes, FastAPI, REST APIs, NLP, spaCy, Hugging Face, LLMs & GenAI, AWS, A/B Testing

CERTIFICATIONS
• AWS Certified Solutions Architect & ML Practitioner
• Databricks Certified Machine Learning Professional

PROJECTS
• Containerized Model Serving Platform: Packaged Scikit-Learn and PyTorch models into FastAPI + Docker microservices on AWS EKS.
• Multilingual Resume & Document Parser: Built entity extraction pipeline using spaCy and Transformers.
""",
    },
    {
        "filename": "04_Arjun_Mehta_Resume.pdf",
        "format": "pdf",
        "recruiter_decision": "Interview Scheduled",
        "initial_note": "Solid ML & MLOps background with 4.5 years experience. Strong in Python, Docker, TensorFlow, Scikit-Learn, Pandas, and SQL.",
        "rating": 4,
        "content": """ARJUN MEHTA
Email: arjun.mehta@mlops.in | Phone: +91 99001 33445 | Location: Pune, India
Current Role: Machine Learning & MLOps Engineer

SUMMARY
Machine Learning Engineer with 4.5 years of hands-on experience in predictive modeling, deep learning, and MLOps infrastructure. Skilled in Python, SQL, Machine Learning, Pandas, Scikit-Learn, TensorFlow, Docker, Kubernetes, and AWS.

WORK EXPERIENCE
Machine Learning Engineer | VerveTech Solutions | Apr 2022 - Present
• Trained and deployed predictive regression and classification models using Python, Scikit-Learn, TensorFlow, and Pandas.
• Containerized ML workloads using Docker and Kubernetes with CI/CD automation on AWS.
• Wrote optimized SQL queries on PostgreSQL and Snowflake for model training datasets.

Associate ML Engineer | AlgoStream Labs | Aug 2021 - Mar 2022
• Built computer vision and tabular ML models using TensorFlow, Scikit-Learn, and NumPy.
• Developed Flask and REST APIs for internal model consumption.

EDUCATION
B.Tech in Computer Science and Engineering | BITS Pilani | 2021 | CGPA: 8.5/10

SKILLS
Python, SQL, PostgreSQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, TensorFlow, Docker, Kubernetes, Flask, REST APIs, MLOps, AWS, CI/CD, Git

CERTIFICATIONS
• Certified Kubernetes Administrator (CKA)
• TensorFlow Developer Certificate

PROJECTS
• Automated MLOps Model Registry: Built end-to-end training and Docker deployment pipeline for Scikit-Learn and TensorFlow models.
""",
    },
    {
        "filename": "05_Vikram_Desai_Resume.txt",
        "format": "txt",
        "recruiter_decision": "Pending Review",
        "initial_note": "Strong Data Scientist with 4 years experience in Python, SQL, Pandas, Scikit-Learn, and Machine Learning, but lacks FastAPI, Docker, and TensorFlow production deployment.",
        "rating": 4,
        "content": """VIKRAM DESAI
Email: vikram.desai@analytics.in | Phone: +91 98201 77665 | Location: Mumbai, India
Current Role: Data Scientist

SUMMARY
Analytical Data Scientist with 4 years of experience in statistical modeling, customer analytics, and machine learning. Proficient in Python, SQL, Pandas, NumPy, Scikit-Learn, XGBoost, Tableau, and A/B Testing.

WORK EXPERIENCE
Data Scientist | RetailIQ Analytics | May 2022 - Present
• Built predictive customer segmentation and propensity models using Python, Scikit-Learn, XGBoost, and Pandas.
• Authored complex SQL queries and ETL pipelines in PostgreSQL and Snowflake to support executive analytics.
• Designed A/B testing frameworks and statistical forecasting models using Time Series techniques.

Junior Data Scientist | FinMetrics Corp | Jun 2020 - Apr 2022
• Performed exploratory data analysis, feature engineering, and regression modeling with Python, Pandas, NumPy, and Matplotlib.

EDUCATION
M.Sc. in Statistics and Data Science | IIT Kanpur | 2020 | CGPA: 8.6/10
B.Sc. in Mathematics | Mumbai University | 2018

SKILLS
Python, R, SQL, PostgreSQL, Snowflake, Machine Learning, Pandas, NumPy, Scikit-Learn, XGBoost, Time Series, A/B Testing, Tableau, Matplotlib

CERTIFICATIONS
• SnowPro Core Certification

PROJECTS
• Demand Forecasting Engine: Built ARIMA and XGBoost forecasting models in Python and Pandas across 1,200 retail SKUs.
""",
    },
    {
        "filename": "06_Sneha_Reddy_Resume.pdf",
        "format": "pdf",
        "recruiter_decision": "Pending Review",
        "initial_note": "Strong Backend & Data Engineer (Python, SQL, FastAPI, Docker, AWS, Spark), transitioning into ML. Has Pandas and basic Scikit-Learn, missing TensorFlow.",
        "rating": 4,
        "content": """SNEHA REDDY
Email: sneha.reddy@clouddev.in | Phone: +91 96112 55443 | Location: Chennai, India
Current Role: Senior Data & Backend Engineer

SUMMARY
Senior Data & Python Backend Engineer with 5 years of experience building scalable data pipelines, FastAPI microservices, and cloud infrastructure using Python, SQL, Pandas, Apache Spark, Docker, Kubernetes, and AWS.

WORK EXPERIENCE
Senior Data & Backend Engineer | StreamLine Data | Jan 2022 - Present
• Designed high-throughput RESTful microservices using Python, FastAPI, PostgreSQL, and Docker deployed on AWS ECS and Kubernetes.
• Built distributed ETL data processing pipelines using Python, Pandas, SQL, Apache Spark, and Airflow.
• Collaborated with data science teams to host Scikit-Learn predictive models in FastAPI containers.

Software Engineer | CloudNova Systems | Jul 2019 - Dec 2021
• Developed backend APIs using Python, FastAPI, Flask, Redis, and PostgreSQL with CI/CD automation.

EDUCATION
B.E. in Computer Science and Engineering | College of Engineering, Guindy (Anna University), Chennai | 2019 | CGPA: 8.8/10

SKILLS
Python, SQL, PostgreSQL, Redis, Pandas, Scikit-Learn, FastAPI, Flask, REST APIs, Docker, Kubernetes, AWS, Apache Spark, Airflow, ETL Pipelines, CI/CD, Linux, Git

CERTIFICATIONS
• AWS Certified Developer - Associate

PROJECTS
• High-Throughput Feature Store API: Built low-latency feature serving service with FastAPI, PostgreSQL, Redis, and Docker.
""",
    },
    {
        "filename": "07_Rohan_Verma_Resume.docx",
        "format": "docx",
        "recruiter_decision": "Pending Review",
        "initial_note": "High-potential Junior ML Engineer (2 years exp). Has Python, SQL, Machine Learning, Pandas, Scikit-Learn, TensorFlow, and FastAPI, but below the 4+ years experience requirement.",
        "rating": 3,
        "content": """ROHAN VERMA
Email: rohan.verma@aiworks.in | Phone: +91 98119 22334 | Location: Noida, India
Current Role: Machine Learning Engineer

SUMMARY
Motivated Machine Learning Engineer with 2 years of industry experience building deep learning and NLP applications using Python, SQL, Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, and FastAPI.

WORK EXPERIENCE
Machine Learning Engineer | NeuralCraft Startup | Jul 2024 - Present
• Built predictive classification models and deep neural networks using Python, Scikit-Learn, and TensorFlow.
• Processed structured datasets using SQL and Pandas and wrapped inference endpoints in FastAPI.
• Experimented with NLP text summarization using Hugging Face and spaCy.

AI Research Intern | VisionAI Lab | Jan 2024 - Jun 2024
• Trained image and text classification models in PyTorch and TensorFlow.

EDUCATION
B.Tech in Artificial Intelligence and Data Science | IIIT Delhi | 2024 | CGPA: 9.1/10

SKILLS
Python, SQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, FastAPI, NLP, spaCy, Hugging Face, Git

CERTIFICATIONS
• TensorFlow Developer Certificate

PROJECTS
• Academic Paper Summarizer: Fine-tuned transformer model using PyTorch and Hugging Face served via FastAPI.
""",
    },
    {
        "filename": "08_Kavita_Nair_Resume.txt",
        "format": "txt",
        "recruiter_decision": "Pending Review",
        "initial_note": "Good Business Intelligence & Data Analyst profile (Python, SQL, Pandas, Tableau), but lacks core ML engineering, TensorFlow, FastAPI, and Docker skills.",
        "rating": 3,
        "content": """KAVITA NAIR
Email: kavita.nair@bianalytics.in | Phone: +91 94470 66778 | Location: Kochi, India
Current Role: Senior Business Intelligence & Data Analyst

SUMMARY
Detail-oriented Data Analyst with 4.5 years of experience in SQL data modeling, Python scripting, Pandas data wrangling, A/B testing, and executive dashboarding in Tableau and Power BI.

WORK EXPERIENCE
Senior Data Analyst | OmniCommerce India | Mar 2022 - Present
• Built automated reporting pipelines and cohort analysis using SQL, PostgreSQL, Python, and Pandas.
• Supported marketing experimentation through A/B testing and basic regression models in Scikit-Learn.
• Created interactive KPI dashboards in Tableau for product leadership.

Data Analyst | Apex Consulting | Aug 2019 - Feb 2022
• Wrote complex SQL queries and data cleaning workflows in Python and Pandas.

EDUCATION
M.Sc. in Data Analytics | Cochin University of Science and Technology | 2019
B.Sc. in Computer Science | Kerala University | 2017

SKILLS
Python, SQL, PostgreSQL, Pandas, NumPy, Scikit-Learn, A/B Testing, Tableau, Matplotlib, ETL Pipelines

PROJECTS
• Executive Revenue Attribution Suite: Automated SQL and Pandas pipeline feeding Tableau workbooks.
""",
    },
    {
        "filename": "09_Aditya_Joshi_Resume.pdf",
        "format": "pdf",
        "recruiter_decision": "Rejected",
        "initial_note": "Strong Cloud DevOps / SRE profile (Docker, Kubernetes, AWS, Terraform, Python, Bash), but no Machine Learning, Scikit-Learn, TensorFlow, or Pandas experience.",
        "rating": 2,
        "content": """ADITYA JOSHI
Email: aditya.joshi@devopscloud.in | Phone: +91 98230 99887 | Location: Bengaluru, India
Current Role: Senior DevOps & Cloud Infrastructure Engineer

SUMMARY
DevOps and Site Reliability Engineer with 6 years of experience automating cloud infrastructure, Kubernetes clusters, Docker container pipelines, and CI/CD workflows on AWS and GCP.

WORK EXPERIENCE
Senior DevOps Engineer | CloudMatrix Technologies | Feb 2021 - Present
• Managed production Kubernetes (EKS) clusters and Docker container registries on AWS using Terraform and Helm.
• Built automated CI/CD deployment pipelines with GitHub Actions, Jenkins, Python, and Bash scripting.
• Administered PostgreSQL and Redis high-availability clusters.

Cloud Infrastructure Engineer | InfraCore Systems | Jun 2018 - Jan 2021
• Automated Linux server provisioning and Docker microservice deployments.

EDUCATION
B.E. in Electronics and Telecommunication | Pune Institute of Computer Technology | 2018

SKILLS
Docker, Kubernetes, AWS, GCP, Terraform, CI/CD, Linux, Bash, Python, SQL, PostgreSQL, Redis, Git

CERTIFICATIONS
• Certified Kubernetes Administrator (CKA)
• AWS Certified DevOps Engineer - Professional

PROJECTS
• Multi-Region Kubernetes Platform: Automated zero-downtime Docker deployments using Terraform and AWS EKS.
""",
    },
    {
        "filename": "10_Meera_Krishnan_Resume.txt",
        "format": "txt",
        "recruiter_decision": "Rejected",
        "initial_note": "Frontend & UI Engineer (React, TypeScript, Tailwind CSS, Node.js). Does not match Machine Learning Engineer requirements.",
        "rating": 2,
        "content": """MEERA KRISHNAN
Email: meera.krishnan@webstudio.in | Phone: +91 98401 55667 | Location: Chennai, India
Current Role: Senior Frontend & Full-Stack Engineer

SUMMARY
Creative Frontend and Full-Stack Web Developer with 3.5 years of experience building responsive SaaS applications using React, TypeScript, JavaScript, Tailwind CSS, Node.js, and GraphQL.

WORK EXPERIENCE
Senior Frontend Engineer | PixelCraft SaaS | Apr 2023 - Present
• Built enterprise analytics dashboards and design systems using React, TypeScript, and Tailwind CSS.
• Integrated REST APIs and GraphQL endpoints with Node.js and PostgreSQL backends.

Software Developer | Webify Digital | Jul 2021 - Mar 2023
• Developed responsive customer portals using React, JavaScript, HTML5, and CSS3.

EDUCATION
B.Tech in Information Technology | SRM Institute of Science and Technology, Chennai | 2021

SKILLS
React, TypeScript, JavaScript, Tailwind CSS, Node.js, GraphQL, REST APIs, SQL, PostgreSQL, Git

PROJECTS
• Enterprise Design System: Created reusable React + Tailwind CSS component library with 98% accessibility score.
""",
    },
]

SECOND_JOB_JD = """Job Title: Full-Stack Cloud & Data Platform Engineer
Department: Platform Engineering
Location: Chennai, India (Hybrid)
Experience Requirement: 3+ years of experience
Education Requirement: B.Tech / B.E. in Computer Science or Information Technology

About the Role:
We are looking for a Full-Stack Cloud & Data Platform Engineer to build scalable Python/FastAPI backend services, PostgreSQL data pipelines, Docker/Kubernetes cloud deployments, and modern React/TypeScript web interfaces.

Key Requirements:
• 3+ years of experience in full-stack or backend cloud engineering.
• Strong proficiency in Python, SQL, PostgreSQL, FastAPI, REST APIs, and Docker.
• Experience with AWS cloud deployment, Kubernetes, and CI/CD automation.
• Preferred: Experience with React, TypeScript, Apache Spark, or Redis.
"""


def write_pdf_file(path: Path, text: str) -> None:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 45
    c.setFont("Helvetica", 9.5)
    for line in text.splitlines():
        # Wrap long lines to 95 chars
        chunks = [line[i : i + 95] for i in range(0, max(1, len(line)), 95)]
        for chunk in chunks:
            if y < 45:
                c.showPage()
                c.setFont("Helvetica", 9.5)
                y = height - 45
            c.drawString(42, y, chunk)
            y -= 13
    c.save()
    path.write_bytes(buffer.getvalue())


def write_docx_file(path: Path, text: str) -> None:
    doc = Document()
    for line in text.splitlines():
        if line.strip():
            doc.add_paragraph(line)
    doc.save(str(path))


def ensure_demo_files_on_disk() -> None:
    settings.DEMO_RESUMES_DIR.mkdir(parents=True, exist_ok=True)
    jd_path = settings.DEMO_RESUMES_DIR.parent / "job_description_ml_engineer.txt"
    jd_path.write_text(SAMPLE_JD_TEXT, encoding="utf-8")

    for item in DEMO_CANDIDATE_RESUMES:
        fpath = settings.DEMO_RESUMES_DIR / item["filename"]
        fmt = item["format"]
        if fmt == "pdf":
            write_pdf_file(fpath, item["content"])
        elif fmt == "docx":
            write_docx_file(fpath, item["content"])
        else:
            fpath.write_text(item["content"], encoding="utf-8")


def process_and_store_resume(
    db: Session,
    job: Job,
    filename: str,
    file_bytes: bytes,
    recruiter_decision: str = "Pending Review",
    initial_note: str = "",
    rating: int = 5,
    saved_path: str = "",
) -> Candidate:
    raw_text, ext, file_hash = parse_resume_document(filename, file_bytes)
    sanitized_text, fairness_audit = sanitize_resume_for_fairness(raw_text)
    profile = extract_candidate_profile(sanitized_text, filename)

    job_data = {
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "min_experience_years": job.min_experience_years,
        "education_level": job.education_level,
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

    eval_res = evaluate_candidate_against_job(
        profile, sanitized_text, job_data, fairness_audit
    )

    candidate = Candidate(
        job_id=job.id,
        full_name=profile["full_name"],
        email=profile["email"],
        phone=profile["phone"],
        location=profile["location"],
        total_experience_years=profile["total_experience_years"],
        highest_education=profile["highest_education"],
        current_title=profile["current_title"],
        summary=profile["summary"],
        certifications=profile["certifications"],
        projects=profile["projects"],
        processing_status="completed",
    )
    db.add(candidate)
    db.flush()

    resume_rec = Resume(
        candidate_id=candidate.id,
        job_id=job.id,
        file_name=filename,
        file_type=ext,
        file_size_bytes=len(file_bytes),
        file_path=saved_path,
        file_hash=file_hash,
        raw_text=raw_text,
        sanitized_text=sanitized_text,
    )
    db.add(resume_rec)

    for sk in profile["skills"]:
        db.add(
            CandidateSkill(
                candidate_id=candidate.id,
                skill_name=sk["skill_name"],
                normalized_name=sk["normalized_name"],
                category=sk["category"],
                proficiency_hint=sk.get("proficiency_hint", "Proficient"),
                is_matched=sk.get("is_matched", False),
                match_type=sk.get("match_type", "additional"),
                similarity_score=sk.get("similarity_score", 0.0),
            )
        )

    for edu in profile["education"]:
        db.add(
            CandidateEducation(
                candidate_id=candidate.id,
                degree=edu["degree"],
                field_of_study=edu["field_of_study"],
                institution=edu["institution"],
                graduation_year=edu["graduation_year"],
                gpa_or_honors=edu.get("gpa_or_honors", ""),
            )
        )

    for exp in profile["experience"]:
        db.add(
            CandidateExperience(
                candidate_id=candidate.id,
                job_title=exp["job_title"],
                company=exp["company"],
                duration=exp["duration"],
                years=exp["years"],
                description=exp["description"],
                relevance_score=exp.get("relevance_score", 0.0),
            )
        )

    sr = ScreeningResult(
        job_id=job.id,
        candidate_id=candidate.id,
        rank_position=1,
        overall_score=eval_res["overall_score"],
        recommendation=eval_res["recommendation"],
        recruiter_decision=recruiter_decision,
        matched_skills=eval_res["matched_skills"],
        missing_skills=eval_res["missing_skills"],
        preferred_matched_skills=eval_res["preferred_matched_skills"],
        strengths=eval_res["strengths"],
        potential_gaps=eval_res["potential_gaps"],
        requirement_comparisons=eval_res["requirement_comparisons"],
        semantic_highlights=eval_res["semantic_highlights"],
        explanation_summary=eval_res["explanation_summary"],
        fairness_audit=eval_res["fairness_audit"],
    )
    db.add(sr)
    db.flush()

    sb = eval_res["score_breakdown"]
    db.add(
        ScreeningScore(
            screening_result_id=sr.id,
            candidate_id=candidate.id,
            skills_percentage=sb["skills_percentage"],
            experience_percentage=sb["experience_percentage"],
            education_percentage=sb["education_percentage"],
            requirements_percentage=sb["requirements_percentage"],
            projects_percentage=sb["projects_percentage"],
            skills_weighted=sb["skills_weighted"],
            experience_weighted=sb["experience_weighted"],
            education_weighted=sb["education_weighted"],
            requirements_weighted=sb["requirements_weighted"],
            projects_weighted=sb["projects_weighted"],
            skills_max_weight=sb["skills_max_weight"],
            experience_max_weight=sb["experience_max_weight"],
            education_max_weight=sb["education_max_weight"],
            requirements_max_weight=sb["requirements_max_weight"],
            projects_max_weight=sb["projects_max_weight"],
            semantic_similarity_score=sb["semantic_similarity_score"],
        )
    )

    if initial_note:
        db.add(
            RecruiterNote(
                candidate_id=candidate.id,
                author_name="Aarav Menon (Lead Technical Recruiter)",
                note_text=initial_note,
                decision_status=recruiter_decision,
                rating=rating,
            )
        )

    db.flush()
    return candidate


def recalculate_job_rankings(db: Session, job_id: int) -> None:
    results = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.job_id == job_id)
        .order_by(ScreeningResult.overall_score.desc(), ScreeningResult.id.asc())
        .all()
    )
    for rank_idx, res in enumerate(results, start=1):
        res.rank_position = rank_idx
    db.commit()


def seed_demo_database(db: Session, force_reset: bool = False) -> Dict[str, Any]:
    ensure_demo_files_on_disk()

    if force_reset:
        db.query(RecruiterNote).delete()
        db.query(ScreeningScore).delete()
        db.query(ScreeningResult).delete()
        db.query(CandidateSkill).delete()
        db.query(CandidateEducation).delete()
        db.query(CandidateExperience).delete()
        db.query(Resume).delete()
        db.query(Candidate).delete()
        db.query(JobRequirement).delete()
        db.query(Job).delete()
        db.commit()

    # Ensure demo recruiter user exists
    user = db.query(User).filter(User.email == "recruiter@talentpulse.ai").first()
    if not user:
        user = User(
            full_name="Aarav Menon",
            email="recruiter@talentpulse.ai",
            password_hash=hash_password("Recruiter@2026"),
            role="Lead Technical Recruiter",
            company="TalentPulse Enterprise AI",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    existing_jobs = db.query(Job).count()
    if existing_jobs > 0 and not force_reset:
        first_job = db.query(Job).order_by(Job.id.asc()).first()
        return {"seeded": False, "primary_job_id": first_job.id}

    # Create Primary Demo Job: Senior Machine Learning Engineer
    ml_job = Job(
        user_id=user.id,
        title="Senior Machine Learning Engineer",
        department="AI & Data Science",
        location="Bengaluru, India (Hybrid)",
        min_experience_years=4.0,
        education_level="Bachelor's",
        employment_type="Full-Time",
        description=SAMPLE_JD_TEXT,
        required_skills=[
            "Python",
            "SQL",
            "Machine Learning",
            "Pandas",
            "Scikit-Learn",
            "TensorFlow",
            "FastAPI",
            "Docker",
        ],
        preferred_skills=[
            "PyTorch",
            "NLP",
            "AWS",
            "Kubernetes",
            "MLOps",
        ],
        weights={
            "skills": 40,
            "experience": 25,
            "education": 15,
            "requirements": 15,
            "projects": 5,
        },
        status="Active",
        is_demo=True,
    )
    db.add(ml_job)
    db.flush()

    extracted_reqs = extract_job_requirements(SAMPLE_JD_TEXT, ml_job.title)
    for req_item in extracted_reqs["requirements"]:
        db.add(
            JobRequirement(
                job_id=ml_job.id,
                category=req_item["category"],
                requirement_text=req_item["requirement_text"],
                importance_weight=req_item["importance_weight"],
                is_mandatory=req_item["is_mandatory"],
            )
        )
    db.flush()

    # Process all 10 realistic resume files against the Senior Machine Learning Engineer job
    for item in DEMO_CANDIDATE_RESUMES:
        fpath = settings.DEMO_RESUMES_DIR / item["filename"]
        file_bytes = fpath.read_bytes()
        process_and_store_resume(
            db=db,
            job=ml_job,
            filename=item["filename"],
            file_bytes=file_bytes,
            recruiter_decision=item["recruiter_decision"],
            initial_note=item["initial_note"],
            rating=item["rating"],
            saved_path=str(fpath),
        )

    recalculate_job_rankings(db, ml_job.id)

    # Create Second Demo Job Opening: Full-Stack Cloud & Data Platform Engineer (with 4 candidates)
    cloud_job = Job(
        user_id=user.id,
        title="Full-Stack Cloud & Data Platform Engineer",
        department="Platform Engineering",
        location="Chennai, India (Hybrid)",
        min_experience_years=3.0,
        education_level="Bachelor's",
        employment_type="Full-Time",
        description=SECOND_JOB_JD,
        required_skills=[
            "Python",
            "SQL",
            "PostgreSQL",
            "FastAPI",
            "REST APIs",
            "Docker",
            "AWS",
        ],
        preferred_skills=["Kubernetes", "React", "TypeScript", "Apache Spark", "Redis"],
        weights={
            "skills": 40,
            "experience": 25,
            "education": 15,
            "requirements": 15,
            "projects": 5,
        },
        status="Active",
        is_demo=True,
    )
    db.add(cloud_job)
    db.flush()

    cloud_reqs = extract_job_requirements(SECOND_JOB_JD, cloud_job.title)
    for req_item in cloud_reqs["requirements"]:
        db.add(
            JobRequirement(
                job_id=cloud_job.id,
                category=req_item["category"],
                requirement_text=req_item["requirement_text"],
                importance_weight=req_item["importance_weight"],
                is_mandatory=req_item["is_mandatory"],
            )
        )
    db.flush()

    for idx in [5, 8, 9, 0]:  # Sneha, Aditya, Meera, Ananya
        item = DEMO_CANDIDATE_RESUMES[idx]
        fpath = settings.DEMO_RESUMES_DIR / item["filename"]
        process_and_store_resume(
            db=db,
            job=cloud_job,
            filename=item["filename"],
            file_bytes=fpath.read_bytes(),
            recruiter_decision="Shortlisted" if idx in (5, 0) else "Pending Review",
            initial_note="Evaluated for Cloud & Data Platform Engineering opening.",
            rating=4,
            saved_path=str(fpath),
        )

    recalculate_job_rankings(db, cloud_job.id)
    return {"seeded": True, "primary_job_id": ml_job.id}
