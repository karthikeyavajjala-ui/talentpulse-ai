export type PageView =
  | 'landing'
  | 'dashboard'
  | 'create-job'
  | 'upload'
  | 'results'
  | 'detail'
  | 'analytics';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  company: string;
}

export interface JobWeights {
  skills: number;
  experience: number;
  education: number;
  requirements: number;
  projects: number;
}

export interface JobRequirementItem {
  id?: number;
  category: string;
  requirement_text: string;
  importance_weight: number;
  is_mandatory: boolean;
}

export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  min_experience_years: number;
  education_level: string;
  employment_type: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  weights: JobWeights;
  status: string;
  is_demo: boolean;
  candidate_count: number;
  average_score: number;
  high_match_count: number;
  shortlisted_count: number;
  top_candidate: {
    id: number;
    full_name: string;
    overall_score: number;
  } | null;
  requirements: JobRequirementItem[];
  created_at: string;
}

export interface ScoreBreakdown {
  skills_percentage: number;
  experience_percentage: number;
  education_percentage: number;
  requirements_percentage: number;
  projects_percentage: number;
  skills_weighted: number;
  experience_weighted: number;
  education_weighted: number;
  requirements_weighted: number;
  projects_weighted: number;
  skills_max_weight: number;
  experience_max_weight: number;
  education_max_weight: number;
  requirements_max_weight: number;
  projects_max_weight: number;
  semantic_similarity_score: number;
}

export interface CandidateSummary {
  id: number;
  job_id: number;
  rank: number;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  current_title: string;
  total_experience_years: number;
  highest_education: string;
  summary: string;
  processing_status: string;
  certifications: string[];
  projects: { title: string; description: string }[];
  overall_score: number;
  recommendation: string;
  recruiter_decision: string;
  matched_skills: string[];
  missing_skills: string[];
  preferred_matched_skills: string[];
  explanation_summary: string;
  skills_percentage: number;
  experience_percentage: number;
  education_percentage: number;
  requirements_percentage: number;
  projects_percentage: number;
  score_breakdown: ScoreBreakdown;
  all_skills: string[];
  resume_file_name: string;
  resume_file_type: string;
  notes_count: number;
  created_at: string;
}

export interface RequirementComparison {
  requirement: string;
  category: string;
  is_mandatory: boolean;
  status: 'Matched' | 'Semantic Match' | 'Partial Match' | 'Missing';
  similarity_score: number;
  evidence: string;
}

export interface SemanticHighlight {
  job_concept: string;
  resume_evidence: string;
  similarity: number;
}

export interface RecruiterNoteItem {
  id: number;
  author_name: string;
  note_text: string;
  decision_status: string;
  rating: number;
  created_at: string;
}

export interface CandidateDetail extends CandidateSummary {
  job_title: string;
  job_required_skills: string[];
  job_preferred_skills: string[];
  job_min_experience_years: number;
  job_education_level: string;
  skills_detailed: {
    id: number;
    skill_name: string;
    category: string;
    proficiency_hint: string;
    is_matched: boolean;
    match_type: string;
    similarity_score: number;
  }[];
  education_detailed: {
    id: number;
    degree: string;
    field_of_study: string;
    institution: string;
    graduation_year: string;
    gpa_or_honors: string;
  }[];
  experience_detailed: {
    id: number;
    job_title: string;
    company: string;
    duration: string;
    years: number;
    description: string;
    relevance_score: number;
  }[];
  strengths: string[];
  potential_gaps: string[];
  requirement_comparisons: RequirementComparison[];
  semantic_highlights: SemanticHighlight[];
  fairness_audit: {
    fairness_guard_active: boolean;
    protected_attributes_used_in_scoring: boolean;
    redacted_attribute_count: number;
    redacted_categories: string[];
    excluded_dimensions: string[];
    disclaimer: string;
  };
  resume_raw_text: string;
  resume_file_size_bytes: number;
  notes: RecruiterNoteItem[];
}

export interface DashboardStats {
  total_jobs: number;
  total_candidates: number;
  average_match_score: number;
  high_match_count: number;
  shortlisted_count: number;
  processing_status: string;
  database_engine: string;
  top_candidates: CandidateSummary[];
  recent_jobs: Job[];
}

export interface AnalyticsData {
  job: Job;
  total_candidates: number;
  highly_matched: number;
  moderately_matched: number;
  low_matched: number;
  average_score: number;
  score_distribution: { range: string; count: number }[];
  skill_coverage: { skill: string; matched_candidates: number; coverage_pct: number }[];
  experience_distribution: { bracket: string; count: number }[];
  education_distribution: { education: string; count: number }[];
  top_matched_skills: { skill: string; count: number }[];
  missing_skill_frequency: { skill: string; count: number }[];
}
