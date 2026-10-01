import re
from typing import Dict, List, Any, Tuple
import spacy
from backend.config import settings

# Load spaCy model once
try:
    nlp = spacy.load(settings.SPACY_MODEL)
except Exception:
    nlp = spacy.blank("en")

# Comprehensive Skill Ontology: canonical_name -> (category, [synonyms / patterns])
SKILL_ONTOLOGY: Dict[str, Tuple[str, List[str]]] = {
    # Programming Languages
    "Python": ("Programming", ["python", "python3", "python 3", "py"]),
    "SQL": ("Databases & Query", ["sql", "tsql", "t-sql", "pl/sql", "plsql", "ansi sql"]),
    "TypeScript": ("Programming", ["typescript", "ts"]),
    "JavaScript": ("Programming", ["javascript", "es6", "ecmascript", "js"]),
    "Java": ("Programming", ["java", "java 17", "java 11", "jdk", "jvm"]),
    "C++": ("Programming", ["c++", "cpp", "c/c++"]),
    "Go": ("Programming", ["golang", "go language"]),
    "Rust": ("Programming", ["rust"]),
    "R": ("Data Science", ["r programming", "r-project", "cran", "rstudio"]),
    "Scala": ("Data Engineering", ["scala"]),
    "Bash": ("DevOps & Cloud", ["bash", "shell scripting", "linux shell", "zsh"]),
    # Machine Learning & AI
    "Machine Learning": (
        "AI & Machine Learning",
        ["machine learning", "ml", "predictive modeling", "statistical learning", "supervised learning", "unsupervised learning"],
    ),
    "Deep Learning": (
        "AI & Machine Learning",
        ["deep learning", "neural networks", "cnn", "rnn", "lstm", "deep neural networks", "dnn"],
    ),
    "NLP": (
        "AI & Machine Learning",
        ["natural language processing", "nlp", "text mining", "named entity recognition", "ner", "computational linguistics", "text classification"],
    ),
    "LLMs & GenAI": (
        "AI & Machine Learning",
        ["large language models", "llm", "llms", "generative ai", "genai", "rag", "retrieval augmented generation", "prompt engineering", "fine-tuning"],
    ),
    "Computer Vision": (
        "AI & Machine Learning",
        ["computer vision", "image processing", "object detection", "yolo", "opencv", "image segmentation"],
    ),
    "TensorFlow": ("AI & Machine Learning", ["tensorflow", "tf", "keras"]),
    "PyTorch": ("AI & Machine Learning", ["pytorch", "torch", "torchvision", "pytorch lightning"]),
    "Scikit-Learn": ("AI & Machine Learning", ["scikit-learn", "sklearn", "scikit learn"]),
    "Hugging Face": ("AI & Machine Learning", ["huggingface", "hugging face", "transformers"]),
    "LangChain": ("AI & Machine Learning", ["langchain", "langgraph", "llamaindex"]),
    "XGBoost": ("AI & Machine Learning", ["xgboost", "lightgbm", "catboost", "gradient boosting"]),
    "spaCy": ("AI & Machine Learning", ["spacy", "nltk", "sentence-transformers"]),
    "MLOps": ("AI & Machine Learning", ["mlops", "mlflow", "kubeflow", "weights & biases", "wandb", "dvc", "model deployment", "model monitoring"]),
    "Time Series": ("Data Science", ["time series", "forecasting", "arima", "prophet"]),
    "A/B Testing": ("Data Science", ["a/b testing", "hypothesis testing", "experimentation", "causal inference", "bayesian statistics"]),
    # Data Analysis & Big Data
    "Pandas": ("Data Science", ["pandas", "geopandas"]),
    "NumPy": ("Data Science", ["numpy", "scipy"]),
    "Apache Spark": ("Data Engineering", ["apache spark", "pyspark", "spark", "spark sql"]),
    "Kafka": ("Data Engineering", ["apache kafka", "kafka", "event streaming"]),
    "Airflow": ("Data Engineering", ["apache airflow", "airflow", "dagster", "prefect"]),
    "Databricks": ("Data Engineering", ["databricks", "delta lake"]),
    "Snowflake": ("Data Engineering", ["snowflake", "bigquery", "redshift"]),
    "dbt": ("Data Engineering", ["dbt", "data build tool"]),
    "ETL Pipelines": ("Data Engineering", ["etl", "elt", "data pipelines", "data warehousing", "data modeling"]),
    "Tableau": ("BI & Analytics", ["tableau", "power bi", "powerbi", "looker"]),
    "Matplotlib": ("Data Science", ["matplotlib", "seaborn", "plotly"]),
    # Cloud & DevOps
    "Docker": ("DevOps & Cloud", ["docker", "containerization", "dockerfile", "docker-compose", "containers"]),
    "Kubernetes": ("DevOps & Cloud", ["kubernetes", "k8s", "helm", "eks", "aks", "gke"]),
    "AWS": ("DevOps & Cloud", ["aws", "amazon web services", "sagemaker", "ec2", "s3", "lambda", "ecs"]),
    "GCP": ("DevOps & Cloud", ["gcp", "google cloud", "google cloud platform", "vertex ai"]),
    "Azure": ("DevOps & Cloud", ["azure", "microsoft azure", "azure ml"]),
    "Terraform": ("DevOps & Cloud", ["terraform", "infrastructure as code", "iac", "ansible", "cloudformation"]),
    "CI/CD": ("DevOps & Cloud", ["ci/cd", "github actions", "gitlab ci", "jenkins", "continuous integration"]),
    "Linux": ("DevOps & Cloud", ["linux", "ubuntu", "debian", "unix", "centos"]),
    "Git": ("DevOps & Cloud", ["git", "github", "gitlab", "version control"]),
    # Backend, Databases & Web
    "FastAPI": ("Backend & APIs", ["fastapi", "fast api"]),
    "Flask": ("Backend & APIs", ["flask"]),
    "Django": ("Backend & APIs", ["django", "django rest framework", "drf"]),
    "Node.js": ("Backend & APIs", ["node.js", "nodejs", "express.js", "nestjs"]),
    "Spring Boot": ("Backend & APIs", ["spring boot", "spring framework", "hibernate"]),
    "REST APIs": ("Backend & APIs", ["rest api", "restful", "rest apis", "openapi", "swagger", "microservices"]),
    "GraphQL": ("Backend & APIs", ["graphql", "grpc", "protobuf"]),
    "PostgreSQL": ("Databases & Query", ["postgresql", "postgres", "postgis", "pgvector"]),
    "MongoDB": ("Databases & Query", ["mongodb", "nosql", "dynamodb", "cassandra"]),
    "Redis": ("Databases & Query", ["redis", "memcached", "caching"]),
    "Elasticsearch": ("Databases & Query", ["elasticsearch", "opensearch", "vector database", "pinecone", "milvus", "weaviate", "chromadb"]),
    "React": ("Frontend", ["react", "react.js", "reactjs", "next.js", "nextjs"]),
    "Tailwind CSS": ("Frontend", ["tailwind", "tailwind css", "css3", "html5"]),
    "System Design": ("Architecture", ["system design", "distributed systems", "scalability", "high availability", "microservices architecture"]),
    "Agile & Scrum": ("Leadership", ["agile", "scrum", "jira", "sprint planning", "cross-functional leadership"]),
}

# Build lookup structures
ALIAS_TO_CANONICAL: Dict[str, Tuple[str, str]] = {}
for canonical, (category, aliases) in SKILL_ONTOLOGY.items():
    ALIAS_TO_CANONICAL[canonical.lower()] = (canonical, category)
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = (canonical, category)

# Sort aliases longest-first to avoid partial word collisions
SORTED_ALIASES = sorted(ALIAS_TO_CANONICAL.keys(), key=len, reverse=True)

INDIAN_AND_GLOBAL_CITIES = [
    "Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Mumbai", "Pune",
    "Delhi", "New Delhi", "Noida", "Gurugram", "Gurgaon", "Kolkata",
    "Ahmedabad", "Kochi", "Coimbatore", "Indore", "Jaipur", "Chandigarh",
    "San Francisco", "New York", "Seattle", "Austin", "London", "Singapore",
    "Toronto", "Berlin", "Remote", "Hybrid",
]

DEGREE_PATTERNS = [
    (r"\b(?:ph\.?d\.?|doctorate|doctor of philosophy)\b", "Ph.D.", 5),
    (r"\b(?:m\.?\s*tech|master of technology)\b", "M.Tech", 4),
    (r"\b(?:m\.?\s*s\.?|m\.?\s*sc\.?|master of science|masters in)\b", "M.S. / M.Sc.", 4),
    (r"\b(?:m\.?\s*b\.?\s*a\.?|master of business administration)\b", "MBA", 4),
    (r"\b(?:m\.?\s*c\.?\s*a\.?|master of computer applications)\b", "MCA", 4),
    (r"\b(?:b\.?\s*tech|bachelor of technology)\b", "B.Tech", 3),
    (r"\b(?:b\.?\s*e\.?|bachelor of engineering)\b", "B.E.", 3),
    (r"\b(?:b\.?\s*s\.?|b\.?\s*sc\.?|bachelor of science)\b", "B.S. / B.Sc.", 3),
    (r"\b(?:b\.?\s*c\.?\s*a\.?|bachelor of computer applications)\b", "BCA", 3),
    (r"\b(?:bachelor'?s?|undergraduate)\b", "Bachelor's", 3),
]


def extract_skills_from_text(text: str) -> List[Dict[str, str]]:
    """Extracts canonical skills and categories from text using boundary-aware regex."""
    text_lower = text.lower()
    found_canonical: Dict[str, Dict[str, str]] = {}

    for alias in SORTED_ALIASES:
        canonical, category = ALIAS_TO_CANONICAL[alias]
        if canonical in found_canonical:
            continue
        # Special handling for single-letter skills like R or C++
        if alias == "c++":
            pattern = r"(?<![a-z0-9])c\+\+(?![a-z0-9])"
        elif alias in ("py", "js", "ts", "ml", "ai", "go", "tf"):
            pattern = rf"(?<![a-z0-9\.\-/]){re.escape(alias)}(?![a-z0-9\.\-/])"
        else:
            pattern = rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])"

        if re.search(pattern, text_lower):
            # Determine proficiency hint based on context
            proficiency = "Proficient"
            expert_pat = rf"(?:expert|advanced|lead|senior|architect|5\+\s*years|deep\s+experience)[^\n\.]*{re.escape(alias)}"
            if re.search(expert_pat, text_lower):
                proficiency = "Expert"
            found_canonical[canonical] = {
                "skill_name": canonical,
                "normalized_name": canonical.lower(),
                "category": category,
                "proficiency_hint": proficiency,
            }

    return list(found_canonical.values())


def extract_contact_info(text: str, filename: str = "") -> Dict[str, str]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    # Email
    email_match = re.search(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text
    )
    email = email_match.group(0) if email_match else "Not specified"

    # Phone
    phone_match = re.search(
        r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{3,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4,5}",
        text,
    )
    phone = phone_match.group(0).strip() if phone_match else "Not specified"

    # Candidate Name
    candidate_name = ""
    for line in lines[:5]:
        clean_line = re.sub(r"^(?:resume|curriculum vitae|cv|name\s*[:\-])\s*", "", line, flags=re.I).strip()
        # Check if first line looks like a person's name (2 to 4 words, mostly letters)
        if (
            clean_line
            and "@" not in clean_line
            and not any(k in clean_line.lower() for k in ["summary", "experience", "education", "skills", "engineer", "developer", "scientist", "analyst", "phone", "email", "http"])
            and 2 <= len(clean_line.split()) <= 4
            and re.match(r"^[A-Za-z\.\s\-']+$", clean_line)
        ):
            candidate_name = clean_line.title()
            break

    if not candidate_name:
        # Use spaCy PERSON entity on first 400 chars
        doc = nlp("\n".join(lines[:8]))
        for ent in doc.ents:
            if ent.label_ == "PERSON" and 2 <= len(ent.text.split()) <= 4:
                candidate_name = ent.text.strip().title()
                break

    if not candidate_name and filename:
        base = re.sub(r"^\d+[_\-\s]*", "", filename.rsplit(".", 1)[0])
        base = re.sub(r"[_\-\s]*(?:resume|cv)$", "", base, flags=re.I)
        candidate_name = base.replace("_", " ").replace("-", " ").strip().title()

    if not candidate_name:
        candidate_name = "Candidate Profile"

    # Location
    location = "Not specified"
    loc_line_match = re.search(r"(?:location|address|based in|city)\s*[:\-]\s*([^\n|•]+)", text, flags=re.I)
    if loc_line_match:
        location = loc_line_match.group(1).strip()
    else:
        for city in INDIAN_AND_GLOBAL_CITIES:
            if re.search(rf"\b{re.escape(city)}\b", text, flags=re.I):
                location = "Bengaluru, India" if city.lower() == "bangalore" else (
                    f"{city}, India" if city in INDIAN_AND_GLOBAL_CITIES[:18] else city
                )
                break

    # Current Title
    current_title = "Software / AI Professional"
    title_patterns = [
        r"(?:current\s+role|title|designation|role)\s*[:\-]\s*([^\n|]+)",
        r"\b((?:Senior|Lead|Principal|Staff|Junior|Associate)?\s*(?:Machine Learning Engineer|Data Scientist|AI Engineer|Full[\s\-]Stack Developer|Backend Engineer|Data Engineer|MLOps Engineer|Software Engineer|Cloud Architect|Analytics Engineer))\b",
    ]
    for pat in title_patterns:
        m = re.search(pat, text[:1200], flags=re.I)
        if m:
            current_title = m.group(1).strip()
            break

    return {
        "full_name": candidate_name,
        "email": email,
        "phone": phone,
        "location": location,
        "current_title": current_title,
    }


def extract_experience_info(text: str) -> Tuple[float, List[Dict[str, Any]]]:
    total_years = 0.0
    # 1. Explicit years mention: e.g., "5+ years of experience", "6.5 years experience"
    exp_mentions = re.findall(
        r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:professional\s+|industry\s+|hands-on\s+|relevant\s+)?experience",
        text,
        flags=re.I,
    )
    if exp_mentions:
        total_years = max(float(x) for x in exp_mentions)

    # 2. Extract structured work experience entries
    experiences: List[Dict[str, Any]] = []
    # Match lines like "Senior ML Engineer | TechCorp India | 2022 - Present (3 years)" or similar
    role_block_pattern = re.compile(
        r"(?P<title>(?:Senior|Lead|Principal|Staff|Junior|Associate|Applied|Research)?\s*"
        r"(?:Machine Learning Engineer|Data Scientist|AI Engineer|Software Engineer|Backend Developer|Data Engineer|MLOps Engineer|Full[\s\-]Stack Engineer|Analytics Engineer|Research Intern|Data Analyst|DevOps Engineer|Python Developer))"
        r"\s*(?:\||—|-|at|,)\s*(?P<company>[A-Za-z0-9\s&\.,\-]{2,55}?)"
        r"(?:\s*(?:\||—|-|\()\s*(?P<duration>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}\s*(?:–|-|to)\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4})))?",
        flags=re.I,
    )

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for idx, line in enumerate(lines):
        m = role_block_pattern.search(line)
        if m and len(line) < 160:
            title = m.group("title").strip()
            company = (m.group("company") or "Enterprise Organization").strip(" |-—(),")
            duration = (m.group("duration") or "").strip()
            if not duration and idx + 1 < len(lines):
                dm = re.search(r"((?:19|20)\d{2}\s*(?:–|-|to)\s*(?:Present|Current|(?:19|20)\d{2}))", lines[idx + 1], flags=re.I)
                if dm:
                    duration = dm.group(1)

            # Calculate years from duration if present
            role_years = 1.5
            yr_matches = re.findall(r"((?:19|20)\d{2})", duration)
            if yr_matches:
                start_yr = int(yr_matches[0])
                end_yr = 2026 if re.search(r"present|current", duration, flags=re.I) else (
                    int(yr_matches[1]) if len(yr_matches) > 1 else start_yr + 1
                )
                role_years = max(0.5, float(end_yr - start_yr))

            # Collect next 2-4 bullet lines as description
            desc_lines = []
            for next_ln in lines[idx + 1 : idx + 6]:
                if role_block_pattern.search(next_ln):
                    break
                if re.match(r"^(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)\b", next_ln, flags=re.I):
                    break
                desc_lines.append(next_ln.lstrip("•-* "))

            experiences.append(
                {
                    "job_title": title,
                    "company": company[:120],
                    "duration": duration or "Recent Role",
                    "years": round(role_years, 1),
                    "description": " ".join(desc_lines)[:600] if desc_lines else line,
                }
            )

    if total_years == 0.0 and experiences:
        total_years = round(sum(e["years"] for e in experiences), 1)
    elif total_years == 0.0:
        # Check any date ranges in text
        years_found = [int(y) for y in re.findall(r"\b(201\d|202[0-6])\b", text)]
        if len(years_found) >= 2:
            span = max(years_found) - min(years_found)
            if 1 <= span <= 20:
                total_years = float(span)

    return round(total_years, 1), experiences[:6]


def extract_education_info(text: str) -> Tuple[str, List[Dict[str, str]]]:
    educations: List[Dict[str, str]] = []
    highest_label = "Bachelor's"
    highest_rank = 0

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for line in lines:
        for pat, deg_label, rank in DEGREE_PATTERNS:
            if re.search(pat, line, flags=re.I):
                if rank > highest_rank:
                    highest_rank = rank
                    highest_label = deg_label

                # Extract field of study
                field_match = re.search(
                    r"(?:in|of)\s+([A-Za-z\s&/]+?)(?:\s*(?:\||—|-|,|\(|from|at|\d{4}|$))",
                    line,
                    flags=re.I,
                )
                field = (
                    field_match.group(1).strip()
                    if field_match
                    else "Computer Science / Engineering"
                )

                # Extract institution
                inst_match = re.search(
                    r"((?:IIT|NIT|IIIT|BITS|VIT|SRM|Anna University|Stanford|MIT|University|Institute|College)[A-Za-z0-9\s,\.\-]{2,70})",
                    line,
                    flags=re.I,
                )
                institution = (
                    inst_match.group(1).strip(" ,|-—")
                    if inst_match
                    else "Accredited University"
                )

                # Extract graduation year
                yr_match = re.search(r"\b(200\d|201\d|202[0-7])\b", line)
                grad_year = yr_match.group(1) if yr_match else "Completed"

                # Extract GPA / CGPA
                gpa_match = re.search(
                    r"(?:cgpa|gpa)\s*[:\-]?\s*(\d+(?:\.\d+)?(?:\s*/\s*\d+(?:\.\d+)?)?)",
                    line,
                    flags=re.I,
                )
                gpa = f"CGPA: {gpa_match.group(1)}" if gpa_match else ""

                # Avoid duplicate degree entries
                if not any(e["degree"] == deg_label and e["graduation_year"] == grad_year for e in educations):
                    educations.append(
                        {
                            "degree": deg_label,
                            "field_of_study": field[:120],
                            "institution": institution[:150],
                            "graduation_year": grad_year,
                            "gpa_or_honors": gpa,
                        }
                    )
                break

    if not educations:
        educations.append(
            {
                "degree": "Bachelor's",
                "field_of_study": "Computer Science / Engineering",
                "institution": "University",
                "graduation_year": "Completed",
                "gpa_or_honors": "",
            }
        )

    return highest_label, educations[:4]


def extract_certifications_and_projects(text: str) -> Tuple[List[str], List[Dict[str, str]]]:
    certs: List[str] = []
    projects: List[Dict[str, str]] = []

    cert_keywords = [
        "AWS Certified",
        "Google Cloud Certified",
        "Professional Machine Learning Engineer",
        "TensorFlow Developer Certificate",
        "Microsoft Certified: Azure",
        "Certified Kubernetes Administrator",
        "CKA",
        "Databricks Certified",
        "DeepLearning.AI",
        "SnowPro Core",
        "PMP",
        "Scrum Master",
    ]
    for ck in cert_keywords:
        m = re.search(rf"([^\n•|]*{re.escape(ck)}[^\n•|]*)", text, flags=re.I)
        if m:
            val = m.group(1).strip(" •-*:\t")
            if 5 <= len(val) <= 130 and val not in certs:
                certs.append(val)

    # Also check lines under CERTIFICATIONS section
    in_cert = False
    in_proj = False
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for line in lines:
        upper = line.upper().rstrip(":")
        if upper in ("CERTIFICATIONS", "CERTIFICATES", "LICENSES & CERTIFICATIONS"):
            in_cert = True
            in_proj = False
            continue
        elif upper in ("PROJECTS", "KEY PROJECTS", "SELECTED PROJECTS", "ACADEMIC & AI PROJECTS"):
            in_proj = True
            in_cert = False
            continue
        elif upper in ("EDUCATION", "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "SKILLS", "TECHNICAL SKILLS", "SUMMARY"):
            in_cert = False
            in_proj = False
            continue

        if in_cert:
            cleaned = line.lstrip("•-* ").strip()
            if 5 <= len(cleaned) <= 140 and cleaned not in certs:
                certs.append(cleaned)
        elif in_proj:
            cleaned = line.lstrip("•-* ").strip()
            if ":" in cleaned or "—" in cleaned or "-" in cleaned:
                sep = ":" if ":" in cleaned else ("—" if "—" in cleaned else "-")
                parts = cleaned.split(sep, 1)
                if len(parts[0].strip()) <= 70:
                    projects.append(
                        {
                            "title": parts[0].strip(),
                            "description": parts[1].strip()[:350],
                        }
                    )
            elif projects and len(cleaned) > 20:
                projects[-1]["description"] = (
                    projects[-1]["description"] + " " + cleaned
                )[:400]
            elif len(cleaned) > 15:
                projects.append({"title": cleaned[:60], "description": cleaned[:300]})

    return certs[:6], projects[:5]


def extract_candidate_profile(sanitized_text: str, filename: str = "") -> Dict[str, Any]:
    contact = extract_contact_info(sanitized_text, filename)
    skills = extract_skills_from_text(sanitized_text)
    total_exp, experiences = extract_experience_info(sanitized_text)
    highest_edu, educations = extract_education_info(sanitized_text)
    certs, projects = extract_certifications_and_projects(sanitized_text)

    # Summary extraction
    lines = [ln.strip() for ln in sanitized_text.splitlines() if ln.strip()]
    summary = ""
    for idx, ln in enumerate(lines[:12]):
        if len(ln) > 65 and "@" not in ln and "|" not in ln:
            summary = ln
            if idx + 1 < len(lines) and len(lines[idx + 1]) > 50 and ":" not in lines[idx + 1][:20]:
                summary += " " + lines[idx + 1]
            break
    if not summary:
        summary = f"{contact['current_title']} with {total_exp} years of experience skilled in {', '.join(s['skill_name'] for s in skills[:5])}."

    return {
        "full_name": contact["full_name"],
        "email": contact["email"],
        "phone": contact["phone"],
        "location": contact["location"],
        "current_title": contact["current_title"],
        "total_experience_years": total_exp,
        "highest_education": highest_edu,
        "summary": summary[:600],
        "skills": skills,
        "education": educations,
        "experience": experiences,
        "certifications": certs,
        "projects": projects,
    }


def extract_job_requirements(jd_text: str, title_hint: str = "") -> Dict[str, Any]:
    """
    Automatically extracts structured requirements, required skills, preferred skills,
    min experience, education level, department, and location from raw Job Description text.
    """
    lines = [ln.strip() for ln in jd_text.splitlines() if ln.strip()]

    # Split JD into mandatory vs preferred sections if present
    lower_jd = jd_text.lower()
    pref_idx = -1
    for marker in ["preferred qualifications", "nice to have", "preferred skills", "bonus skills", "good to have", "plus:"]:
        pos = lower_jd.find(marker)
        if pos != -1:
            pref_idx = pos
            break

    if pref_idx != -1:
        core_text = jd_text[:pref_idx]
        pref_text = jd_text[pref_idx:]
    else:
        core_text = jd_text
        pref_text = ""

    core_skills = [s["skill_name"] for s in extract_skills_from_text(core_text)]
    pref_skills = [
        s["skill_name"]
        for s in extract_skills_from_text(pref_text)
        if s["skill_name"] not in core_skills
    ]

    # If no preferred section was explicitly labeled, take the last 25% of skills as preferred if > 6 skills
    if not pref_skills and len(core_skills) > 6:
        split_pt = max(4, int(len(core_skills) * 0.72))
        pref_skills = core_skills[split_pt:]
        core_skills = core_skills[:split_pt]

    # Experience requirement
    exp_matches = re.findall(r"(\d+)\s*\+?\s*(?:to\s*\d+\s*)?(?:years|yrs)", jd_text, flags=re.I)
    min_exp = float(min(int(x) for x in exp_matches)) if exp_matches else 3.0

    # Education requirement
    edu_level = "Bachelor's"
    for pat, label, _ in DEGREE_PATTERNS:
        if re.search(pat, jd_text, flags=re.I):
            edu_level = label
            break

    # Title inference
    inferred_title = title_hint.strip() if title_hint else ""
    if not inferred_title:
        title_m = re.search(r"(?:job\s+title|role|position)\s*[:\-]\s*([^\n]+)", jd_text, flags=re.I)
        if title_m:
            inferred_title = title_m.group(1).strip()
        elif lines:
            inferred_title = lines[0][:100]

    # Department inference
    department = "AI & Data Science"
    if any(k in lower_jd for k in ["frontend", "react", "full-stack", "fullstack", "backend"]):
        department = "Platform Engineering"
    elif any(k in lower_jd for k in ["cloud", "devops", "kubernetes", "sre"]):
        department = "Cloud Infrastructure"

    # Location inference
    location = "Bengaluru, India (Hybrid)"
    for city in INDIAN_AND_GLOBAL_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", jd_text, flags=re.I):
            location = f"{city}, India" if city in INDIAN_AND_GLOBAL_CITIES[:18] else city
            break

    # Individual requirement statements
    requirement_items: List[Dict[str, Any]] = []
    for line in lines:
        cleaned = line.lstrip("•-*0123456789.) ").strip()
        if 22 <= len(cleaned) <= 240 and not cleaned.endswith(":"):
            is_pref = any(w in cleaned.lower() for w in ["preferred", "nice to have", "bonus", "plus", "familiarity"])
            category = "preferred_skill" if is_pref else (
                "experience" if "year" in cleaned.lower() else (
                    "qualification" if any(d in cleaned.lower() for d in ["degree", "bachelor", "master", "b.tech", "m.tech", "phd"]) else "responsibility"
                )
            )
            requirement_items.append(
                {
                    "category": category,
                    "requirement_text": cleaned,
                    "importance_weight": 0.6 if is_pref else 1.0,
                    "is_mandatory": not is_pref,
                }
            )

    return {
        "title": inferred_title or "Senior Machine Learning Engineer",
        "department": department,
        "location": location,
        "min_experience_years": min_exp,
        "education_level": edu_level,
        "required_skills": core_skills,
        "preferred_skills": pref_skills,
        "requirements": requirement_items[:12],
    }
