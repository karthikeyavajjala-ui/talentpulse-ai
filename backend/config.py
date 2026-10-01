import os
from pathlib import Path

# Project root:
# E:\Internship\AIResume
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from project root
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


class Settings:
    PROJECT_NAME: str = "AI Resume Screening & Candidate Intelligence Platform"
    VERSION: str = "2.4.0"

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://resume_user:resume_pass@localhost:5432/resume_screening",
    )

    # Windows-safe SQLite fallback
    FALLBACK_DATABASE_URL: str = os.getenv(
        "FALLBACK_DATABASE_URL",
        f"sqlite:///{(BASE_DIR / 'backend' / 'data' / 'resume_screening.db').as_posix()}",
    )

    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "tp_enterprise_ai_resume_screening_secret_2026_x99k2m",
    )

    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    MAX_UPLOAD_SIZE_MB: int = int(
        os.getenv("MAX_UPLOAD_SIZE_MB", "10")
    )

    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024

    ALLOWED_EXTENSIONS: set = set(
        os.getenv(
            "ALLOWED_EXTENSIONS",
            "pdf,docx,txt"
        ).lower().split(",")
    )

    # E:\Internship\AIResume\backend\uploads
    UPLOAD_DIR: Path = BASE_DIR / "backend" / "uploads"

    # E:\Internship\AIResume\demo_dataset\resumes
    DEMO_RESUMES_DIR: Path = (
        BASE_DIR / "demo_dataset" / "resumes"
    )

    SPACY_MODEL: str = os.getenv(
        "SPACY_MODEL",
        "en_core_web_md"
    )

    FAIRNESS_GUARD_ENABLED: bool = (
        os.getenv(
            "FAIRNESS_GUARD_ENABLED",
            "true"
        ).lower() == "true"
    )


settings = Settings()

settings.UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

settings.DEMO_RESUMES_DIR.mkdir(
    parents=True,
    exist_ok=True
)