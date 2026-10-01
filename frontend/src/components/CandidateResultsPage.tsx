import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Sliders,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import { api } from '../api';
import { Job, CandidateSummary, JobWeights, PageView } from '../types';

interface CandidateResultsPageProps {
  jobs: Job[];
  selectedJobId: number;
  onSelectJob: (jobId: number) => void;
  onInspectCandidate: (candidateId: number) => void;
  onNavigate: (page: PageView) => void;
  onJobsUpdated: () => void;
}

export const CandidateResultsPage: React.FC<CandidateResultsPageProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onInspectCandidate,
  onNavigate,
  onJobsUpdated,
}) => {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [skillFilter, setSkillFilter] = useState('');
  const [minExperience, setMinExperience] = useState<string>('');
  const [educationFilter, setEducationFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [certFilter, setCertFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('highest_match');

  // Configurable Scoring Weights Drawer State
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [weights, setWeights] = useState<JobWeights>({
    skills: 40,
    experience: 25,
    education: 15,
    requirements: 15,
    projects: 5,
  });
  const [isRecalculating, setIsRecalculating] = useState(false);

  const fetchCandidates = useCallback(async () => {
    if (!selectedJobId) return;
    setLoading(true);
    try {
      const res = await api.getJobCandidates(selectedJobId, {
        search: search || undefined,
        min_score: minScore > 0 ? minScore : undefined,
        skill: skillFilter || undefined,
        min_experience: minExperience ? Number(minExperience) : undefined,
        education: educationFilter !== 'All' ? educationFilter : undefined,
        location: locationFilter !== 'All' ? locationFilter : undefined,
        certification: certFilter || undefined,
        status_filter: statusFilter !== 'All' ? statusFilter : undefined,
        sort_by: sortBy,
      });
      setActiveJob(res.job);
      setCandidates(res.candidates);
      if (res.job.weights) {
        setWeights(res.job.weights);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [
    selectedJobId,
    search,
    minScore,
    skillFilter,
    minExperience,
    educationFilter,
    locationFilter,
    certFilter,
    statusFilter,
    sortBy,
  ]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleRecalculateWeights = async () => {
    if (!selectedJobId) return;
    setIsRecalculating(true);
    try {
      await api.updateJobWeights(selectedJobId, weights);
      await fetchCandidates();
      onJobsUpdated();
      setShowWeightsModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update weights.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDecisionChange = async (candidateId: number, newDecision: string) => {
    try {
      await api.updateCandidateDecision(candidateId, newDecision);
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, recruiter_decision: newDecision } : c
        )
      );
      onJobsUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setMinScore(0);
    setSkillFilter('');
    setMinExperience('');
    setEducationFilter('All');
    setLocationFilter('All');
    setCertFilter('');
    setStatusFilter('All');
    setSortBy('highest_match');
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85)
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    if (score >= 72)
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    if (score >= 58)
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Export Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Candidate Screening & Ranking
            </h1>
            {jobs.length > 0 && (
              <select
                value={selectedJobId}
                onChange={(e) => onSelectJob(Number(e.target.value))}
                className="rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.candidate_count})
                  </option>
                ))}
              </select>
            )}
          </div>
          {activeJob && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {activeJob.department} • {activeJob.location} • Min Exp: {activeJob.min_experience_years}+ yrs •{' '}
              Showing <strong>{candidates.length}</strong> ranked candidate(s)
            </p>
          )}
        </div>

        {/* Actions: Weights Config, View Mode, Export CSV / Excel / PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowWeightsModal(!showWeightsModal)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-sm transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            Scoring Weights
          </button>

          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-sm transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            + Upload Resumes
          </button>

          {/* View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          {/* Export Buttons: CSV, Excel, PDF */}
          <div className="flex items-center gap-1.5">
            <a
              href={api.getExportUrl(selectedJobId, 'csv')}
              download
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </a>
            <a
              href={api.getExportUrl(selectedJobId, 'excel')}
              download
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition"
              title="Download Formatted Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </a>
            <a
              href={api.getExportUrl(selectedJobId, 'pdf')}
              download
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
              title="Download Executive PDF Report"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF Report
            </a>
          </div>
        </div>
      </div>

      {/* Configurable Scoring Weights Panel */}
      {showWeightsModal && (
        <div className="glass-card rounded-2xl p-5 border-2 border-indigo-500/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Transparent Scoring Engine — Configurable Dimension Weights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust weights below and click "Recalculate Scores" to dynamically re-score and re-rank all candidates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setWeights({
                    skills: 40,
                    experience: 25,
                    education: 15,
                    requirements: 15,
                    projects: 5,
                  })
                }
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Reset to Default (40/25/15/15/5)
              </button>
              <button
                onClick={handleRecalculateWeights}
                disabled={isRecalculating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition disabled:opacity-50"
              >
                {isRecalculating ? 'Re-Scoring...' : 'Apply Weights & Recalculate Rankings'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'skills', label: 'Skills Match' },
              { key: 'experience', label: 'Experience Match' },
              { key: 'education', label: 'Education Match' },
              { key: 'requirements', label: 'JD Requirements' },
              { key: 'projects', label: 'Certs & Projects' },
            ].map((w) => (
              <div
                key={w.key}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>{w.label}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {weights[w.key as keyof JobWeights]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={weights[w.key as keyof JobWeights]}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      [w.key]: Number(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Bar */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search by Name or Skill */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, email, role, or skill (e.g. Rahul, Docker, NLP)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filter by Skill */}
          <div className="lg:col-span-2">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">All Skills</option>
              {(activeJob?.required_skills || ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Scikit-Learn', 'TensorFlow', 'FastAPI', 'Docker']).map((sk) => (
                <option key={sk} value={sk}>
                  Skill: {sk}
                </option>
              ))}
              <option value="PyTorch">Skill: PyTorch</option>
              <option value="NLP">Skill: NLP</option>
              <option value="AWS">Skill: AWS</option>
              <option value="Kubernetes">Skill: Kubernetes</option>
            </select>
          </div>

          {/* Min Experience */}
          <div className="lg:col-span-2">
            <select
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">Any Experience</option>
              <option value="2">2+ Years Exp</option>
              <option value="4">4+ Years Exp</option>
              <option value="5">5+ Years Exp</option>
            </select>
          </div>

          {/* Education Filter */}
          <div className="lg:col-span-2">
            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Education</option>
              <option value="M.Tech">M.Tech</option>
              <option value="M.S.">M.S. / M.Sc.</option>
              <option value="B.Tech">B.Tech / B.E.</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300"
            >
              <option value="highest_match">Sort: Highest Match</option>
              <option value="lowest_match">Sort: Lowest Match</option>
              <option value="most_experience">Sort: Most Experience</option>
              <option value="most_skills">Sort: Most Skills</option>
              <option value="recently_processed">Sort: Recently Processed</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Min Score Slider, Location, Certifications, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="lg:col-span-3 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Min Score: <strong>{minScore}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            >
              <option value="All">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Noida">Noida</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <input
              type="text"
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              placeholder="Filter by certification (e.g. AWS, TensorFlow, CKA)..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            >
              <option value="All">All Review Statuses</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Loading or Empty States */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500">Ranking and filtering candidates...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            No candidates match the active filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* RICH CANDIDATE INTELLIGENCE CARDS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {candidates.map((cand) => {
            const sb = cand.score_breakdown;
            return (
              <div
                key={cand.id}
                className="glass-card rounded-2xl p-6 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-5"
              >
                {/* Top Row: Rank, Candidate Info, Overall Match Score */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                        #{cand.rank}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => onInspectCandidate(cand.id)}
                            className="text-lg font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
                          >
                            {cand.full_name}
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getScoreBadgeColor(
                              cand.overall_score
                            )}`}
                          >
                            {cand.recommendation}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                          {cand.current_title}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                            {cand.total_experience_years} yrs exp
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                            {cand.highest_education}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            {cand.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Score Pill */}
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {Math.round(cand.overall_score)}%
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500">
                        Match Score
                      </div>
                    </div>
                  </div>

                  {/* Multi-Metric Visual Score Bars (Skills, Experience, Education, Requirements) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Skills</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {Math.round(cand.skills_percentage)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, cand.skills_percentage)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sb.skills_weighted}/{sb.skills_max_weight} pts
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Experience</span>
                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                          {Math.round(cand.experience_percentage)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full"
                          style={{ width: `${Math.min(100, cand.experience_percentage)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sb.experience_weighted}/{sb.experience_max_weight} pts
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Education</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {Math.round(cand.education_percentage)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, cand.education_percentage)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sb.education_weighted}/{sb.education_max_weight} pts
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">JD Semantic</span>
                        <span className="text-sky-600 dark:text-sky-400 font-bold">
                          {Math.round(cand.requirements_percentage)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full"
                          style={{ width: `${Math.min(100, cand.requirements_percentage)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sb.requirements_weighted}/{sb.requirements_max_weight} pts
                      </div>
                    </div>
                  </div>

                  {/* Matched Skills & Missing Skills */}
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Matched Skills ({cand.matched_skills.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cand.matched_skills.length > 0 ? (
                          cand.matched_skills.map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-1">
                        Missing:
                      </span>
                      {cand.missing_skills.length > 0 ? (
                        cand.missing_skills.map((sk) => (
                          <span
                            key={sk}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-medium"
                          >
                            <XCircle className="w-3 h-3" />
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          All required skills matched!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Recruiter Decision Status, Download Resume, Inspect Details */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={cand.recruiter_decision}
                      onChange={(e) => handleDecisionChange(cand.id, e.target.value)}
                      className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <a
                      href={api.getResumeDownloadUrl(cand.id)}
                      download
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                      title={`Download ${cand.resume_file_name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {cand.resume_file_type.toUpperCase()}
                    </a>
                  </div>

                  <button
                    onClick={() => onInspectCandidate(cand.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect AI Analysis & Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ENTERPRISE TABLE VIEW */
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Match Score</th>
                  <th className="py-3.5 px-4">Skills</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Education</th>
                  <th className="py-3.5 px-4">Matched & Missing Skills</th>
                  <th className="py-3.5 px-4">Recommendation</th>
                  <th className="py-3.5 px-4 text-right">Resume & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                {candidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3.5 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      #{cand.rank}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onInspectCandidate(cand.id)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 text-left block"
                      >
                        {cand.full_name}
                      </button>
                      <span className="text-slate-500">
                        {cand.location} • {cand.total_experience_years} yrs
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {Math.round(cand.overall_score)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {Math.round(cand.skills_percentage)}%
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-violet-600 dark:text-violet-400">
                      {Math.round(cand.experience_percentage)}%
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {Math.round(cand.education_percentage)}% ({cand.highest_education})
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {cand.matched_skills.slice(0, 4).map((sk) => (
                          <span
                            key={sk}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                        {cand.missing_skills.slice(0, 3).map((sk) => (
                          <span
                            key={sk}
                            className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-semibold"
                          >
                            ✗ {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScoreBadgeColor(
                          cand.overall_score
                        )}`}
                      >
                        {cand.recommendation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <a
                        href={api.getResumeDownloadUrl(cand.id)}
                        download
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        {cand.resume_file_type.toUpperCase()}
                      </a>
                      <button
                        onClick={() => onInspectCandidate(cand.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
