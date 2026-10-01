-- ============================================================================
-- AI Resume Screening & Candidate Intelligence Platform
-- PostgreSQL Database Schema (Production DDL)
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'recruiter' NOT NULL,
    company VARCHAR(150) DEFAULT 'TalentPulse Enterprise',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. JOBS TABLE (Screening Sessions / Job Openings)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(120) NOT NULL,
    location VARCHAR(150) NOT NULL,
    min_experience_years FLOAT DEFAULT 0.0,
    education_level VARCHAR(120) DEFAULT 'Bachelor''s',
    employment_type VARCHAR(80) DEFAULT 'Full-Time',
    description TEXT NOT NULL,
    required_skills JSONB DEFAULT '[]'::jsonb,
    preferred_skills JSONB DEFAULT '[]'::jsonb,
    weights JSONB DEFAULT '{"skills": 40, "experience": 25, "education": 15, "requirements": 15, "projects": 5}'::jsonb,
    status VARCHAR(50) DEFAULT 'Active',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- 3. JOB REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS job_requirements (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    category VARCHAR(80) NOT NULL, -- 'required_skill', 'preferred_skill', 'responsibility', 'qualification', 'experience'
    requirement_text TEXT NOT NULL,
    importance_weight FLOAT DEFAULT 1.0,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_requirements_job_id ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_job_requirements_category ON job_requirements(category);

-- 4. CANDIDATES TABLE
-- Note: Protected characteristics (gender, religion, caste, race, age, marital status, photo)
-- are strictly excluded by design in compliance with AI fairness principles.
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    full_name VARCHAR(180) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(80),
    location VARCHAR(180),
    total_experience_years FLOAT DEFAULT 0.0,
    highest_education VARCHAR(150),
    current_title VARCHAR(180),
    summary TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    processing_status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_full_name ON candidates(full_name);
CREATE INDEX IF NOT EXISTS idx_candidates_location ON candidates(location);
CREATE INDEX IF NOT EXISTS idx_candidates_experience ON candidates(total_experience_years);

-- 5. RESUMES TABLE
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(30) NOT NULL, -- 'pdf', 'docx', 'txt'
    file_size_bytes INTEGER DEFAULT 0,
    file_path VARCHAR(500),
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for duplicate detection
    raw_text TEXT NOT NULL,
    sanitized_text TEXT NOT NULL, -- Text after Fairness Guard strips protected attributes
    parsed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_job_hash ON resumes(job_id, file_hash);

-- 6. CANDIDATE SKILLS TABLE
CREATE TABLE IF NOT EXISTS candidate_skills (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_name VARCHAR(120) NOT NULL,
    normalized_name VARCHAR(120) NOT NULL,
    category VARCHAR(100) DEFAULT 'Technical',
    proficiency_hint VARCHAR(60) DEFAULT 'Proficient',
    is_matched BOOLEAN DEFAULT FALSE,
    match_type VARCHAR(50) DEFAULT 'none', -- 'exact', 'synonym', 'semantic', 'additional'
    similarity_score FLOAT DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate_id ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_normalized ON candidate_skills(normalized_name);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_matched ON candidate_skills(is_matched);

-- 7. CANDIDATE EDUCATION TABLE
CREATE TABLE IF NOT EXISTS candidate_education (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    degree VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(180),
    institution VARCHAR(255),
    graduation_year VARCHAR(30),
    gpa_or_honors VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_candidate_education_candidate_id ON candidate_education(candidate_id);

-- 8. CANDIDATE EXPERIENCE TABLE
CREATE TABLE IF NOT EXISTS candidate_experience (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_title VARCHAR(180) NOT NULL,
    company VARCHAR(200),
    duration VARCHAR(100),
    years FLOAT DEFAULT 0.0,
    description TEXT,
    relevance_score FLOAT DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_candidate_experience_candidate_id ON candidate_experience(candidate_id);

-- 9. SCREENING RESULTS TABLE
CREATE TABLE IF NOT EXISTS screening_results (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    rank_position INTEGER DEFAULT 1,
    overall_score FLOAT NOT NULL,
    recommendation VARCHAR(80) NOT NULL, -- 'Strong Match', 'Good Match', 'Moderate Match', 'Low Match'
    recruiter_decision VARCHAR(80) DEFAULT 'Pending Review', -- 'Shortlisted', 'Interview Scheduled', 'Pending Review', 'Rejected'
    matched_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    preferred_matched_skills JSONB DEFAULT '[]'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    potential_gaps JSONB DEFAULT '[]'::jsonb,
    requirement_comparisons JSONB DEFAULT '[]'::jsonb,
    semantic_highlights JSONB DEFAULT '[]'::jsonb,
    explanation_summary TEXT,
    fairness_audit JSONB DEFAULT '{}'::jsonb,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screening_results_job_id ON screening_results(job_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_score ON screening_results(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_screening_results_rank ON screening_results(job_id, rank_position);

-- 10. SCREENING SCORES TABLE (Transparent Component-by-Component Breakdown)
CREATE TABLE IF NOT EXISTS screening_scores (
    id SERIAL PRIMARY KEY,
    screening_result_id INTEGER NOT NULL UNIQUE REFERENCES screening_results(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skills_percentage FLOAT NOT NULL,
    experience_percentage FLOAT NOT NULL,
    education_percentage FLOAT NOT NULL,
    requirements_percentage FLOAT NOT NULL,
    projects_percentage FLOAT NOT NULL,
    skills_weighted FLOAT NOT NULL,
    experience_weighted FLOAT NOT NULL,
    education_weighted FLOAT NOT NULL,
    requirements_weighted FLOAT NOT NULL,
    projects_weighted FLOAT NOT NULL,
    skills_max_weight FLOAT DEFAULT 40.0,
    experience_max_weight FLOAT DEFAULT 25.0,
    education_max_weight FLOAT DEFAULT 15.0,
    requirements_max_weight FLOAT DEFAULT 15.0,
    projects_max_weight FLOAT DEFAULT 5.0,
    semantic_similarity_score FLOAT DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_screening_scores_candidate_id ON screening_scores(candidate_id);

-- 11. RECRUITER NOTES TABLE
CREATE TABLE IF NOT EXISTS recruiter_notes (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) DEFAULT 'Senior Technical Recruiter',
    note_text TEXT NOT NULL,
    decision_status VARCHAR(80),
    rating INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_notes_candidate_id ON recruiter_notes(candidate_id);
