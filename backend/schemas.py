from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    company: Optional[str] = "TalentPulse Enterprise"


class ExtractJDRequest(BaseModel):
    description: str
    title: Optional[str] = ""


class JobWeights(BaseModel):
    skills: float = Field(default=40.0, ge=0, le=100)
    experience: float = Field(default=25.0, ge=0, le=100)
    education: float = Field(default=15.0, ge=0, le=100)
    requirements: float = Field(default=15.0, ge=0, le=100)
    projects: float = Field(default=5.0, ge=0, le=100)


class CreateJobRequest(BaseModel):
    title: str
    department: str
    location: str
    min_experience_years: float = 3.0
    education_level: str = "Bachelor's"
    employment_type: str = "Full-Time"
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    weights: Optional[JobWeights] = None


class CreateNoteRequest(BaseModel):
    note_text: str
    author_name: Optional[str] = "Aarav Menon (Lead Technical Recruiter)"
    decision_status: Optional[str] = None
    rating: Optional[int] = 5


class UpdateDecisionRequest(BaseModel):
    recruiter_decision: str
