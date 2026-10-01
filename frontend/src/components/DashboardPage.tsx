import React from 'react';
import {
  Briefcase,
  Users,
  Award,
  CheckCircle2,
  PlusCircle,
  UploadCloud,
  BarChart3,
  ArrowRight,
  Database,
  Activity,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { DashboardStats, PageView } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  onNavigate: (page: PageView) => void;
  onSelectJobAndNavigate: (jobId: number, page: PageView) => void;
  onInspectCandidate: (candidateId: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  onNavigate,
  onSelectJobAndNavigate,
  onInspectCandidate,
}) => {
  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Loading Recruitment Intelligence Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Recruitment Intelligence Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Activity className="w-3.5 h-3.5" />
              {stats.processing_status}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span>Real-time overview of active job openings, NLP resume screening pipelines, and top-ranked candidates.</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Database className="w-3.5 h-3.5" />
              {stats.database_engine}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('create-job')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Screening Session
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Upload Resumes
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            View Analytics
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Screening Sessions
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.total_jobs}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Active job pipelines
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Candidates Screened
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.total_candidates}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              PDF, DOCX & TXT parsed
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Match Score
            </p>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.average_match_score}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Semantic + skill weighted
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Highly Matched (≥80%)
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.high_match_count}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {stats.shortlisted_count} shortlisted for interview
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Screening Sessions & Top Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Recent Screening Sessions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Active Screening Sessions (Jobs)
            </h2>
            <button
              onClick={() => onNavigate('create-job')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Create New Job Opening
            </button>
          </div>

          <div className="space-y-4">
            {stats.recent_jobs.map((job) => (
              <div
                key={job.id}
                className="glass-card rounded-2xl p-5 hover:border-indigo-500/40 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      {job.is_demo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Demo Dataset
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                      <span>{job.department}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{job.min_experience_years}+ yrs exp</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                        {job.average_score}%
                      </div>
                      <div className="text-[11px] text-slate-500">Avg Match</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {job.candidate_count}
                      </div>
                      <div className="text-[11px] text-slate-500">Candidates</div>
                    </div>
                  </div>
                </div>

                {/* Required Skills Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {job.required_skills.slice(0, 8).map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {job.top_candidate ? (
                      <span>
                        Top Candidate:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {job.top_candidate.full_name} ({Math.round(job.top_candidate.overall_score)}%)
                        </strong>
                      </span>
                    ) : (
                      <span>No resumes uploaded yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectJobAndNavigate(job.id, 'upload')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    >
                      + Upload Resumes
                    </button>
                    <button
                      onClick={() => onSelectJobAndNavigate(job.id, 'analytics')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => onSelectJobAndNavigate(job.id, 'results')}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                    >
                      View Ranked Candidates
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Top Candidates Leaderboard */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Top Ranked Candidates
            </h2>
            <button
              onClick={() => onNavigate('results')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All Rankings →
            </button>
          </div>

          <div className="glass-card rounded-2xl divide-y divide-slate-200/70 dark:divide-slate-800">
            {stats.top_candidates.map((cand, idx) => (
              <div
                key={cand.id}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <button
                      onClick={() => onInspectCandidate(cand.id)}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block text-left"
                    >
                      {cand.full_name}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {cand.current_title} • {cand.total_experience_years} yrs • {cand.highest_education}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cand.matched_skills.slice(0, 4).map((sk) => (
                        <span
                          key={sk}
                          className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                      {cand.missing_skills.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-medium">
                          Missing: {cand.missing_skills[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {Math.round(cand.overall_score)}%
                  </div>
                  <button
                    onClick={() => onInspectCandidate(cand.id)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Inspect AI →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
