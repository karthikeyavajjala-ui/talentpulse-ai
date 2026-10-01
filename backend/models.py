from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    ForeignKey,
    DateTime,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="recruiter", nullable=False)
    company = Column(String(150), default="TalentPulse Enterprise")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    jobs = relationship("Job", back_populates="owner")
    notes = relationship("RecruiterNote", back_populates="user")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    department = Column(String(120), nullable=False)
    location = Column(String(150), nullable=False)
    min_experience_years = Column(Float, default=0.0)
    education_level = Column(String(120), default="Bachelor's")
    employment_type = Column(String(80), default="Full-Time")
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    weights = Column(
        JSON,
        default=lambda: {
            "skills": 40,
            "experience": 25,
            "education": 15,
            "requirements": 15,
            "projects": 5,
        },
    )
    status = Column(String(50), default="Active", index=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="jobs")
    requirements = relationship(
        "JobRequirement", back_populates="job", cascade="all, delete-orphan"
    )
    candidates = relationship(
        "Candidate", back_populates="job", cascade="all, delete-orphan"
    )
    resumes = relationship(
        "Resume", back_populates="job", cascade="all, delete-orphan"
    )
    screening_results = relationship(
        "ScreeningResult", back_populates="job", cascade="all, delete-orphan"
    )


class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(
        Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category = Column(String(80), nullable=False, index=True)
    requirement_text = Column(Text, nullable=False)
    importance_weight = Column(Float, default=1.0)
    is_mandatory = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    job = relationship("Job", back_populates="requirements")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(
        Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    full_name = Column(String(180), nullable=False, index=True)
    email = Column(String(255))
    phone = Column(String(80))
    location = Column(String(180), index=True)
    total_experience_years = Column(Float, default=0.0, index=True)
    highest_education = Column(String(150))
    current_title = Column(String(180))
    summary = Column(Text)
    certifications = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    processing_status = Column(String(50), default="completed")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    job = relationship("Job", back_populates="candidates")
    resume = relationship(
        "Resume", back_populates="candidate", uselist=False, cascade="all, delete-orphan"
    )
    skills = relationship(
        "CandidateSkill", back_populates="candidate", cascade="all, delete-orphan"
    )
    education = relationship(
        "CandidateEducation", back_populates="candidate", cascade="all, delete-orphan"
    )
    experience = relationship(
        "CandidateExperience", back_populates="candidate", cascade="all, delete-orphan"
    )
    screening_result = relationship(
        "ScreeningResult",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan",
    )
    screening_score = relationship(
        "ScreeningScore",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan",
    )
    notes = relationship(
        "RecruiterNote",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="desc(RecruiterNote.created_at)",
    )


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    job_id = Column(
        Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(30), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    file_path = Column(String(500))
    file_hash = Column(String(64), nullable=False)
    raw_text = Column(Text, nullable=False)
    sanitized_text = Column(Text, nullable=False)
    parsed_at = Column(DateTime(timezone=True), default=utcnow)

    candidate = relationship("Candidate", back_populates="resume")
    job = relationship("Job", back_populates="resumes")

    __table_args__ = (Index("idx_resumes_job_hash", "job_id", "file_hash"),)


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_name = Column(String(120), nullable=False)
    normalized_name = Column(String(120), nullable=False, index=True)
    category = Column(String(100), default="Technical")
    proficiency_hint = Column(String(60), default="Proficient")
    is_matched = Column(Boolean, default=False, index=True)
    match_type = Column(String(50), default="none")
    similarity_score = Column(Float, default=0.0)

    candidate = relationship("Candidate", back_populates="skills")


class CandidateEducation(Base):
    __tablename__ = "candidate_education"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    degree = Column(String(150), nullable=False)
    field_of_study = Column(String(180))
    institution = Column(String(255))
    graduation_year = Column(String(30))
    gpa_or_honors = Column(String(100))

    candidate = relationship("Candidate", back_populates="education")


class CandidateExperience(Base):
    __tablename__ = "candidate_experience"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_title = Column(String(180), nullable=False)
    company = Column(String(200))
    duration = Column(String(100))
    years = Column(Float, default=0.0)
    description = Column(Text)
    relevance_score = Column(Float, default=0.0)

    candidate = relationship("Candidate", back_populates="experience")


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(
        Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    rank_position = Column(Integer, default=1)
    overall_score = Column(Float, nullable=False, index=True)
    recommendation = Column(String(80), nullable=False)
    recruiter_decision = Column(String(80), default="Pending Review")
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    preferred_matched_skills = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    potential_gaps = Column(JSON, default=list)
    requirement_comparisons = Column(JSON, default=list)
    semantic_highlights = Column(JSON, default=list)
    explanation_summary = Column(Text)
    fairness_audit = Column(JSON, default=dict)
    evaluated_at = Column(DateTime(timezone=True), default=utcnow)

    job = relationship("Job", back_populates="screening_results")
    candidate = relationship("Candidate", back_populates="screening_result")
    score_breakdown = relationship(
        "ScreeningScore",
        back_populates="screening_result",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ScreeningScore(Base):
    __tablename__ = "screening_scores"

    id = Column(Integer, primary_key=True, index=True)
    screening_result_id = Column(
        Integer,
        ForeignKey("screening_results.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skills_percentage = Column(Float, nullable=False)
    experience_percentage = Column(Float, nullable=False)
    education_percentage = Column(Float, nullable=False)
    requirements_percentage = Column(Float, nullable=False)
    projects_percentage = Column(Float, nullable=False)
    skills_weighted = Column(Float, nullable=False)
    experience_weighted = Column(Float, nullable=False)
    education_weighted = Column(Float, nullable=False)
    requirements_weighted = Column(Float, nullable=False)
    projects_weighted = Column(Float, nullable=False)
    skills_max_weight = Column(Float, default=40.0)
    experience_max_weight = Column(Float, default=25.0)
    education_max_weight = Column(Float, default=15.0)
    requirements_max_weight = Column(Float, default=15.0)
    projects_max_weight = Column(Float, default=5.0)
    semantic_similarity_score = Column(Float, default=0.0)

    screening_result = relationship("ScreeningResult", back_populates="score_breakdown")
    candidate = relationship("Candidate", back_populates="screening_score")


class RecruiterNote(Base):
    __tablename__ = "recruiter_notes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name = Column(String(150), default="Senior Technical Recruiter")
    note_text = Column(Text, nullable=False)
    decision_status = Column(String(80))
    rating = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    candidate = relationship("Candidate", back_populates="notes")
    user = relationship("User", back_populates="notes")
