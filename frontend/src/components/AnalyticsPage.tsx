import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { api } from '../api';
import { Job, AnalyticsData } from '../types';

interface AnalyticsPageProps {
  jobs: Job[];
  selectedJobId: number;
  onSelectJob: (jobId: number) => void;
}

const PIE_COLORS = ['#4f46e5', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    api
      .getJobAnalytics(selectedJobId)
      .then((res) => setData(res))
      .catch((err) => console.error('Analytics load error:', err))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm text-slate-500">Generating Talent Pool Analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Recruitment & Talent Pool Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Deep statistical insights into candidate score distribution, skill coverage, and missing competency gaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {jobs.length > 0 && (
            <select
              value={selectedJobId}
              onChange={(e) => onSelectJob(Number(e.target.value))}
              className="rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.candidate_count} candidates)
                </option>
              ))}
            </select>
          )}
          <a
            href={api.getExportUrl(selectedJobId, 'pdf')}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF Report
          </a>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">
              Total Candidates
            </span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {data.total_candidates}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg Score: <strong>{data.average_score}%</strong>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-600">
              Highly Matched (≥80%)
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {data.highly_matched}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Ready for technical interview
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600">
              Moderately Matched (60–79%)
            </span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {data.moderately_matched}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Potential fit with minor skill gaps
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-600">
              Low Match (&lt;60%)
            </span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {data.low_matched}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Missing core JD requirements
          </div>
        </div>
      </div>

      {/* Charts Grid (6 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Candidate Score Distribution */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1. Candidate Score Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Number of candidates across overall AI match score cohorts
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Candidates" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Skill Coverage % Across Required Skills */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2. Required Skill Coverage (%)
            </h3>
            <p className="text-xs text-slate-500">
              Percentage of applicant pool possessing each mandatory JD skill
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.skill_coverage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="skill" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="coverage_pct" name="Coverage %" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Experience Distribution */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              3. Candidate Experience Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Years of professional industry experience across candidates
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.experience_distribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="bracket" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Candidates" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Education Distribution */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              4. Highest Education Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Academic degree breakdown across screened candidates
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.education_distribution}
                  dataKey="count"
                  nameKey="education"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  label
                >
                  {data.education_distribution.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Top Matched Skills */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              5. Top Matched Skills Frequency
            </h3>
            <p className="text-xs text-slate-500">
              Most frequently verified required & preferred skills in applicant pool
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_matched_skills}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="skill" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Matched Count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Missing Skill Frequency */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              6. Missing Skill Frequency (Talent Gap Analysis)
            </h3>
            <p className="text-xs text-slate-500">
              Required JD skills most frequently missing among applicants
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.missing_skill_frequency}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Missing Count" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
