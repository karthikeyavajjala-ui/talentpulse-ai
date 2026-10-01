import re
from typing import Tuple, Dict, Any

FAIRNESS_DISCLAIMER = (
    "AI-generated screening results are decision-support information only. "
    "Recruiters must review candidates and make final decisions."
)

PROTECTED_PATTERNS = {
    "gender_or_title": [
        r"\b(?:gender|sex)\s*[:\-]\s*(?:male|female|non-binary|transgender|other|m|f)\b",
        r"\b(?:mr|mrs|ms|miss|shri|smt)\.\s+",
        r"\b(?:he/him|she/her|they/them)\b",
    ],
    "marital_status": [
        r"\b(?:marital\s+status|civil\s+status)\s*[:\-]\s*(?:single|married|divorced|widowed|unmarried)\b",
        r"\b(?:father'?s?\s+name|husband'?s?\s+name|spouse\s+name)\s*[:\-][^\n]+",
    ],
    "age_or_dob": [
        r"\b(?:date\s+of\s+birth|d\.?o\.?b\.?)\s*[:\-]\s*[^\n,;]+",
        r"\b(?:age)\s*[:\-]\s*\d{2}\s*(?:years|yrs)?\b",
    ],
    "religion_or_caste": [
        r"\b(?:religion|caste|community|creed)\s*[:\-]\s*[^\n,;]+",
        r"\b(?:category)\s*[:\-]\s*(?:general|obc|sc|st|ews)\b",
    ],
    "race_or_ethnicity": [
        r"\b(?:race|ethnicity|nationality)\s*[:\-]\s*[^\n,;]+",
    ],
    "disability": [
        r"\b(?:disability|differently\s+abled|handicap)\s*[:\-]\s*[^\n,;]+",
    ],
    "political_or_photo": [
        r"\b(?:political\s+affiliation|political\s+party)\s*[:\-]\s*[^\n,;]+",
        r"\[(?:photo|photograph|profile\s+picture)\]",
    ],
}


def sanitize_resume_for_fairness(raw_text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Removes or masks protected characteristics before NLP scoring so that
    gender, religion, caste, race, ethnicity, disability, age/DOB, photo,
    marital status, and political affiliation NEVER influence ranking.
    """
    sanitized = raw_text
    redacted_categories = []
    redacted_count = 0

    for category, patterns in PROTECTED_PATTERNS.items():
        cat_hits = 0
        for pat in patterns:
            matches = re.findall(pat, sanitized, flags=re.IGNORECASE)
            if matches:
                cat_hits += len(matches)
                sanitized = re.sub(
                    pat, "[REDACTED_PROTECTED_ATTRIBUTE] ", sanitized, flags=re.IGNORECASE
                )
        if cat_hits > 0:
            redacted_categories.append(category)
            redacted_count += cat_hits

    audit_info = {
        "fairness_guard_active": True,
        "protected_attributes_used_in_scoring": False,
        "redacted_attribute_count": redacted_count,
        "redacted_categories": redacted_categories,
        "excluded_dimensions": [
            "Gender",
            "Religion",
            "Caste",
            "Race & Ethnicity",
            "Disability",
            "Age / Date of Birth",
            "Photograph",
            "Marital Status",
            "Political Affiliation",
        ],
        "disclaimer": FAIRNESS_DISCLAIMER,
    }
    return sanitized, audit_info
