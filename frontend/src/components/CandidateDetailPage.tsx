import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Download,
  MessageSquarePlus,
  ShieldCheck,
  Star,
  Cpu,
  FolderGit2,
} from 'lucide-react';
import { api } from '../api';
import { CandidateDetail } from '../types';

interface CandidateDetailPageProps {
  candidateId: number;
  onBack: () => void;
  onCandidateUpdated: () => void;
}

export const CandidateDetailPage: React.FC<CandidateDetailPageProps> = ({
  candidateId,
  onBack,
  onCandidateUpdated,
}) => {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'profile' | 'resume'>('analysis');

  // Recruiter Note Form State
  const [noteText, setNoteText] = useState('');
  const [decisionStatus, setDecisionStatus] = useState('Shortlisted');
  const [rating, setRating] = useState(5);
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getCandidateDetail(candidateId)
      .then((data) => {
        if (mounted) {
          setCandidate(data);
          setDecisionStatus(data.recruiter_decision || 'Shortlisted');
        }
      })
      .catch((err) => console.error('Error loading candidate detail:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [candidateId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !noteText.trim()) return;
    setIsSavingNote(true);
    try {
      const added = await api.addCandidateNote(candidate.id, {
        note_text: noteText,
        decision_status: decisionStatus,
        rating,
      });
      setCandidate({
        ...candidate,
        recruiter_decision: decisionStatus,
        notes: [added, ...candidate.notes],
      });
      setNoteText('');
      onCandidateUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to save note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading || !candidate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm text-slate-500">Loading Candidate Intelligence Profile...</p>
      </div>
    );
  }

  const sb = candidate.score_breakdown;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ranked Candidates ({candidate.job_title})
        </button>

        <div className="flex items-center gap-2">
          <a
            href={api.getResumeDownloadUrl(candidate.id)}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Download Original Resume ({candidate.resume_file_name})
          </a>
        </div>
      </div>

      {/* Candidate Header Banner */}
      <div className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-600">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              #{candidate.rank}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {candidate.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {candidate.recommendation}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Status: {candidate.recruiter_decision}
                </span>
              </div>

              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {candidate.current_title} • Screened for {candidate.job_title}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.total_experience_years} Years Experience
                </span>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.highest_education}
                </span>
              </div>
            </div>
          </div>

          {/* Transparent Score Summary Box */}
          <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
            <div className="text-center pr-4 border-r border-slate-200 dark:border-slate-700">
              <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {Math.round(candidate.overall_score)}%
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Overall Score
              </div>
            </div>

            <div className="space-y-1 text-xs font-medium">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Skills:</span>
                <strong className="text-slate-900 dark:text-white">
                  {sb.skills_weighted}/{sb.skills_max_weight}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Experience:</span>
                <strong className="text-slate-900 dark:text-white">
                  {sb.experience_weighted}/{sb.experience_max_weight}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Education:</span>
                <strong className="text-slate-900 dark:text-white">
                  {sb.education_weighted}/{sb.education_max_weight}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Requirements:</span>
                <strong className="text-slate-900 dark:text-white">
                  {sb.requirements_weighted}/{sb.requirements_max_weight}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Projects/Certs:</span>
                <strong className="text-slate-900 dark:text-white">
                  {sb.projects_weighted}/{sb.projects_max_weight}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'analysis', label: 'AI Analysis & Requirement Comparison', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'profile', label: 'Extracted Candidate Profile (Education, Experience, Skills)', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'resume', label: 'Raw Resume Text & Fairness Audit', icon: <FileText className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Left 8 Cols (Tab Content) + Right 4 Cols (Recruiter Review & Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'analysis' && (
            <>
              {/* Executive Explanation Summary */}
              <div className="glass-card rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  AI Score Explanation & Transparent Breakdown
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  {candidate.explanation_summary}
                </p>

                {/* Detailed Score Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { label: 'Skills Match', pts: `${sb.skills_weighted}/${sb.skills_max_weight}`, pct: sb.skills_percentage, color: 'bg-indigo-600' },
                    { label: 'Experience', pts: `${sb.experience_weighted}/${sb.experience_max_weight}`, pct: sb.experience_percentage, color: 'bg-violet-600' },
                    { label: 'Education', pts: `${sb.education_weighted}/${sb.education_max_weight}`, pct: sb.education_percentage, color: 'bg-emerald-600' },
                    { label: 'Requirements', pts: `${sb.requirements_weighted}/${sb.requirements_max_weight}`, pct: sb.requirements_percentage, color: 'bg-sky-600' },
                    { label: 'Projects/Certs', pts: `${sb.projects_weighted}/${sb.projects_max_weight}`, pct: sb.projects_percentage, color: 'bg-amber-600' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {item.pts}
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {Math.round(item.pct)}% accuracy
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* "Why this candidate matches" & "Potential gaps" */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6 border-t-4 border-t-emerald-500 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Why This Candidate Matches (Strengths)
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {candidate.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card rounded-2xl p-6 border-t-4 border-t-amber-500 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Potential Gaps & Missing Requirements
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {candidate.potential_gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Requirement-by-Requirement Comparison Matrix */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Requirement-by-Requirement Comparison Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Every Job Description requirement compared semantically against sentences in {candidate.full_name}'s resume.
                  </p>
                </div>

                <div className="space-y-3">
                  {candidate.requirement_comparisons.map((rc, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rc.status === 'Matched'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : rc.status === 'Semantic Match'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : rc.status === 'Partial Match'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {rc.status}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {rc.requirement}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {Math.round(rc.similarity_score)}% Semantic Match
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 pl-3 border-l-2 border-indigo-500">
                        <strong>Resume Evidence:</strong> "{rc.evidence}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Similarity Highlights */}
              {candidate.semantic_highlights.length > 0 && (
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Neural Vector Semantic Similarity Pairs
                    </h3>
                    <p className="text-xs text-slate-500">
                      Demonstrates how spaCy 300-D embeddings match conceptual meaning even when exact phrasing differs.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {candidate.semantic_highlights.map((sh, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 grid grid-cols-1 md:grid-cols-11 gap-3 items-center text-xs"
                      >
                        <div className="md:col-span-5">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 block">
                            Job Concept
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {sh.job_concept}
                          </span>
                        </div>
                        <div className="md:col-span-1 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                            {Math.round(sh.similarity)}%
                          </span>
                        </div>
                        <div className="md:col-span-5">
                          <span className="text-[10px] font-bold uppercase text-emerald-600 block">
                            Candidate Resume Evidence
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            "{sh.resume_evidence}"
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'profile' && (
            <>
              {/* Skills Breakdown */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Extracted Skills & Taxonomy Classification ({candidate.skills_detailed.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills_detailed.map((sk) => (
                    <div
                      key={sk.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                        sk.is_matched
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold">{sk.skill_name}</span>
                      <span className="text-[10px] opacity-75">({sk.category})</span>
                      {sk.is_matched && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience Timeline */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Relevant Work Experience ({candidate.total_experience_years} Years Total)
                </h3>
                <div className="space-y-4">
                  {candidate.experience_detailed.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {exp.job_title} — <span className="text-indigo-600 dark:text-indigo-400">{exp.company}</span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            {exp.duration} ({exp.years} yrs)
                          </p>
                        </div>
                        {exp.relevance_score > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            {Math.round(exp.relevance_score)}% Role Relevance
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education, Certifications & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-violet-600" />
                    Education
                  </h3>
                  {candidate.education_detailed.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1"
                    >
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {edu.degree} in {edu.field_of_study}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {edu.institution} • {edu.graduation_year}
                      </div>
                      {edu.gpa_or_honors && (
                        <div className="text-xs font-semibold text-emerald-600">
                          {edu.gpa_or_honors}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Certifications & Projects
                  </h3>
                  {candidate.certifications.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold uppercase text-slate-500">
                        Certifications:
                      </div>
                      {candidate.certifications.map((c, i) => (
                        <div
                          key={i}
                          className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          {c}
                        </div>
                      ))}
                    </div>
                  )}

                  {candidate.projects.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold uppercase text-slate-500">
                        Key Technical Projects:
                      </div>
                      {candidate.projects.map((p, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                            {p.title}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'resume' && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Parsed Resume Document ({candidate.resume_file_name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Extracted via {candidate.resume_file_type.toUpperCase()} document parser ({(candidate.resume_file_size_bytes / 1024).toFixed(1)} KB)
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Fairness Guard Verified
                </span>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[540px]">
                {candidate.resume_raw_text}
              </pre>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Recruiter Review & Notes Studio */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-indigo-600" />
              Recruiter Review & Notes
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Hiring Stage / Decision
                </label>
                <select
                  value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold"
                >
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Recruiter Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`p-1.5 rounded-lg border transition ${
                        rating >= num
                          ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 text-amber-500'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Evaluation Note *
                </label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add interview feedback, technical observations, or follow-up questions..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingNote}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {isSavingNote ? 'Saving Review...' : 'Save Recruiter Review & Note'}
              </button>
            </form>

            {/* Existing Notes List */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-500">
                Review History ({candidate.notes.length})
              </div>
              {candidate.notes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No recruiter notes recorded yet.
                </p>
              ) : (
                candidate.notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {n.author_name}
                      </span>
                      <span className="text-amber-500 font-bold">
                        {'★'.repeat(n.rating || 5)}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {n.note_text}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Decision: {n.decision_status}</span>
                      <span>
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
