# TalentPulse AI — Resume Screening & Candidate Intelligence Platform

A full-stack, production-grade **AI Resume Screening & Candidate Intelligence Platform** built with **React 18 + TypeScript + Tailwind CSS + Recharts** on the frontend and **Python FastAPI + spaCy (`en_core_web_md`) + scikit-learn + PyMuPDF + python-docx + SQLAlchemy + PostgreSQL 17** on the backend.

> **Fairness & Ethical AI Disclaimer:**  
> *"AI-generated screening results are decision-support information only. Recruiters must review candidates and make final decisions."*

---

## 1. Complete Project Structure

```text
/home/user/
├── .env.example                           # Environment variable template
├── .env                                   # Active runtime configuration
├── README.md                              # Architecture, API & setup documentation
├── database/
│   └── schema.sql                         # Complete PostgreSQL 17 DDL schema (11 tables + indexes)
├── demo_dataset/
│   ├── job_description_ml_engineer.txt    # Sample Senior Machine Learning Engineer JD
│   └── resumes/                           # 10 realistic multi-format resumes (.pdf, .docx, .txt)
│       ├── 01_Rahul_Kumar_Resume.pdf
│       ├── 02_Ananya_Iyer_Resume.pdf
│       ├── 03_Priya_Sharma_Resume.docx
│       ├── 04_Arjun_Mehta_Resume.pdf
│       ├── 05_Vikram_Desai_Resume.txt
│       ├── 06_Sneha_Reddy_Resume.pdf
│       ├── 07_Rohan_Verma_Resume.docx
│       ├── 08_Kavita_Nair_Resume.txt
│       ├── 09_Aditya_Joshi_Resume.pdf
│       └── 10_Meera_Krishnan_Resume.txt
├── backend/
│   ├── main.py                            # FastAPI application, REST endpoints & rate limiting
│   ├── config.py                          # Environment settings loader
│   ├── database.py                        # PostgreSQL 17 engine + persistent SQLite fallback
│   ├── models.py                          # SQLAlchemy 2.0 ORM models for all 11 tables
│   ├── schemas.py                         # Pydantic validation schemas
│   ├── auth.py                            # bcrypt password hashing & PyJWT authentication
│   ├── exporter.py                        # CSV, Excel (.xlsx) & PDF report generators
│   ├── seed_demo.py                       # Demo dataset file generator & database seeder
│   └── nlp/
│       ├── __init__.py
│       ├── document_parser.py             # PyMuPDF (fitz), pdfplumber, python-docx & TXT parser
│       ├── fairness_guard.py              # Protected attribute redaction & fairness audit
│       ├── extractor.py                   # spaCy NER + 140-skill ontology & JD requirement extractor
│       └── matcher.py                     # 300-D vector semantic matcher & transparent scoring engine
└── frontend/
    ├── package.json
    ├── vite.config.ts                     # Vite config (0.0.0.0 bind, allowedHosts, /api proxy)
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types.ts
        ├── api.ts
        └── components/
            ├── FairnessBanner.tsx         # Persistent Zero-Bias Audit & Ethical AI Banner
            ├── Navbar.tsx                 # Responsive SaaS header, job switcher & theme toggle
            ├── LandingPage.tsx            # Hero, AI pipeline visualizer & semantic match demo
            ├── DashboardPage.tsx          # Executive KPIs, active sessions & top leaderboard
            ├── CreateJobPage.tsx          # JD input, AI requirement auto-extraction & weight sliders
            ├── UploadResumesPage.tsx      # Drag-and-drop multi-file uploader & pipeline tracker
            ├── CandidateResultsPage.tsx   # Ranked cards/table, search/filter/sort & CSV/XLSX/PDF export
            ├── CandidateDetailPage.tsx    # Profile, requirement matrix, semantic pairs & recruiter notes
            ├── AnalyticsPage.tsx          # 6 Recharts visualizations of the candidate pool
            └── AuthModal.tsx              # JWT login, registration & demo account switcher
```

---

## 2. AI/NLP Resume Screening Pipeline

```text
Job Description
       ↓
Text Preprocessing & Normalization
       ↓
Automated Requirement Extraction (Required/Preferred Skills, Min Experience, Education, Clauses)
       ↓
Multi-Format Resume Parsing (PyMuPDF/pdfplumber for PDF, python-docx for DOCX, UTF-8/Latin-1 for TXT)
       ↓
Fairness Guard Sanitization (Redacts Gender, Religion, Caste, Race, Age, Marital Status, Disability, Photo)
       ↓
Candidate Entity Extraction (spaCy en_core_web_md + Regex + 140-Skill Domain Ontology)
       ↓
Semantic Comparison (300-D Neural Word Vectors + Lexical/TF-IDF Cosine Similarity + Concept Bridges)
       ↓
Transparent Configurable Scoring Engine (Skills 40%, Experience 25%, Education 15%, Requirements 15%, Projects 5%)
       ↓
Automated Candidate Ranking & Explainability ("Why this candidate matches" & "Potential gaps")
       ↓
Recruiter Intelligence Dashboard & Multi-Format Export (CSV, Excel .xlsx, PDF Report)
```

---

## 3. Transparent & Configurable Matching Algorithm

Unlike black-box screening tools, every candidate receives an explicit, auditable score breakdown across 5 configurable dimensions:

| Dimension | Default Weight | Methodology |
| :--- | :--- | :--- |
| **Skills Match** | **40%** | Exact canonical matches, synonym resolution (`sklearn` → `Scikit-Learn`), semantic skill neighbor credit, and preferred skill bonus |
| **Experience Match** | **25%** | Total years of experience vs. JD requirement + role-level semantic similarity |
| **Education Match** | **15%** | Degree hierarchy (`Ph.D.` > `M.Tech / M.S.` > `B.Tech / B.E.`) + STEM/CS/AI field relevance |
| **Job Requirement Match** | **15%** | Sentence-by-sentence semantic vector similarity against mandatory and preferred JD clauses |
| **Certifications & Projects** | **5%** | Verified industry certifications (`AWS`, `TensorFlow`, `CKA`) and relevant technical projects |
| **Total** | **100%** | Dynamically re-calculates and re-ranks candidates when weights are modified |

---

## 4. Database Schema (PostgreSQL 17)

Defined in `database/schema.sql` and `backend/models.py` with foreign keys and B-tree indexes:

1. `users` — Recruiter accounts with `bcrypt` password hashes
2. `jobs` — Screening sessions, JD text, required/preferred skills, and configurable JSON weights
3. `job_requirements` — Extracted mandatory and preferred requirement clauses
4. `candidates` — Extracted candidate contact, experience years, education summary, and status
5. `resumes` — File metadata, SHA-256 hash for duplicate prevention, raw text, and fairness-sanitized text
6. `candidate_skills` — Normalized skills, categories, match status, and similarity scores
7. `candidate_education` — Degrees, fields of study, institutions, graduation years, and CGPA
8. `candidate_experience` — Work history roles, companies, durations, descriptions, and relevance scores
9. `screening_results` — Rank position, overall score, recommendation, matched/missing skills, strengths, gaps, requirement matrix, and fairness audit JSON
10. `screening_scores` — Granular weighted points and percentages for all 5 scoring dimensions
11. `recruiter_notes` — Timestamped recruiter reviews, hiring stage decisions, and 1–5 star ratings

---

## 5. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status, active DB engine, spaCy model, and fairness disclaimer |
| `POST` | `/api/auth/login` | Authenticate recruiter and return JWT access token |
| `POST` | `/api/auth/register` | Register a new recruiter account with bcrypt hashing |
| `GET` | `/api/dashboard/stats` | Aggregate metrics, recent jobs, and top candidates leaderboard |
| `POST` | `/api/demo/reset` | Reset and re-seed the 10-candidate demo dataset |
| `POST` | `/api/jobs/extract-requirements` | Automatically extract skills & requirements from raw JD text |
| `GET` | `/api/jobs` | List all job openings with candidate counts and average scores |
| `POST` | `/api/jobs` | Create a new job opening / screening session |
| `GET` | `/api/jobs/{id}` | Retrieve job details, requirements, and scoring weights |
| `PUT` | `/api/jobs/{id}/weights` | Update scoring weights and re-rank all candidates in real time |
| `POST` | `/api/jobs/{id}/resumes` | Upload & process multiple PDF, DOCX, and TXT resumes |
| `GET` | `/api/jobs/{id}/candidates` | Get ranked candidates with search, multi-filter, and sorting |
| `GET` | `/api/candidates/{id}` | Get full candidate profile, resume text, and AI analysis |
| `GET` | `/api/candidates/{id}/analysis` | Get detailed score breakdown, strengths, gaps, and requirement matrix |
| `POST` | `/api/candidates/{id}/notes` | Add recruiter review note, rating, and decision status |
| `PATCH` | `/api/candidates/{id}/status` | Update candidate decision (`Shortlisted`, `Interview Scheduled`, etc.) |
| `GET` | `/api/candidates/{id}/resume/download` | Download original `.pdf`, `.docx`, or `.txt` resume file |
| `GET` | `/api/jobs/{id}/analytics` | Get 6 analytical distributions for charts |
| `GET` | `/api/jobs/{id}/export?format=csv\|excel\|pdf` | Export ranked results as CSV, Excel (`.xlsx`), or PDF Report |

---

## 6. Local Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 15+ (automatically falls back to persistent SQLite if PostgreSQL is offline)

### 1. Backend Setup
```bash
pip install fastapi uvicorn sqlalchemy pymupdf pdfplumber python-docx openpyxl reportlab pyjwt python-multipart bcrypt psycopg2-binary spacy scikit-learn
python3 -m spacy download en_core_web_md

# Start FastAPI server on port 8000
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open the live application at `http://localhost:5173`.
