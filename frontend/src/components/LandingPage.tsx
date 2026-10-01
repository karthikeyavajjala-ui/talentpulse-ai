import React from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Cpu,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  XCircle,
  Scale,
  Download,
  Zap,
  Layers,
  Search,
  Award,
} from 'lucide-react';
import { PageView, DashboardStats } from '../types';

interface LandingPageProps {
  onNavigate: (page: PageView) => void;
  onInspectCandidate: (candidateId: number) => void;
  stats: DashboardStats | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onInspectCandidate,
  stats,
}) => {
  const topCand = stats?.top_candidates?.[0];

  const pipelineSteps = [
    { step: '01', title: 'Job Description', desc: 'Input raw JD text & role metadata' },
    { step: '02', title: 'Text Preprocessing', desc: 'Tokenization, normalization & cleaning' },
    { step: '03', title: 'Requirement Extraction', desc: 'Mandatory vs preferred JD criteria' },
    { step: '04', title: 'Skill & Role Ontology', desc: '140+ canonical skills & synonyms' },
    { step: '05', title: 'Multi-Format Parsing', desc: 'PyMuPDF (PDF), python-docx & TXT' },
    { step: '06', title: 'Fairness Sanitization', desc: 'Strips protected demographic traits' },
    { step: '07', title: 'Candidate Extraction', desc: 'spaCy NER for education & experience' },
    { step: '08', title: 'Semantic Comparison', desc: '300-d dense vectors + TF-IDF cosine' },
    { step: '09', title: 'Transparent Scoring', desc: 'Configurable 5-factor weighted rubric' },
    { step: '10', title: 'Explainable Ranking', desc: 'Strengths, gaps & recruiter export' },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-14 md:py-16 gradient-hero border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/90 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise AI Resume Screening & Candidate Intelligence</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Explainable AI Resume Screening{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 bg-clip-text text-transparent">
                  Without Black-Box Bias.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Parse bulk PDF, DOCX, and TXT resumes in seconds. Extract structured candidate profiles with{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-100">spaCy NLP</span>, compute semantic vector similarity beyond exact keywords, and rank talent with a{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-100">100% transparent, configurable scoring rubric</span>.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => onNavigate('results')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition transform hover:-translate-y-0.5"
                >
                  <span>Start Screening (Live Demo Ready)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('upload')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-300 dark:border-slate-700 shadow-sm transition"
                >
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Upload Resumes (PDF / DOCX / TXT)</span>
                </button>

                <button
                  onClick={() => onNavigate('create-job')}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-semibold text-sm transition"
                >
                  <span>+ Create Job Opening</span>
                </button>
              </div>

              {/* Key Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {stats?.total_candidates || 14}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Demo Resumes Pre-Screened
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    300-D
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    spaCy Neural Vector Matching
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    0% Bias
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Protected Trait Redaction
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Candidate Intelligence Preview Card */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-2xl p-6 shadow-xl border border-indigo-500/20 relative">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-extrabold text-xs">
                      #1 RANKED
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {topCand ? topCand.full_name : 'Rahul Kumar'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Senior Machine Learning Engineer • 5.5 yrs exp
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {topCand ? `${Math.round(topCand.overall_score)}%` : '95%'}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Strong Match
                    </span>
                  </div>
                </div>

                {/* Transparent Breakdown Bars */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Transparent Score Breakdown (Configurable)
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      Total = 100%
                    </span>
                  </div>
                  {[
                    { label: 'Skills Match (40% weight)', pct: topCand?.skills_percentage ?? 97, pts: `${topCand?.score_breakdown?.skills_weighted ?? 38.8}/40`, color: 'bg-indigo-600' },
                    { label: 'Experience Match (25% weight)', pct: topCand?.experience_percentage ?? 91, pts: `${topCand?.score_breakdown?.experience_weighted ?? 22.7}/25`, color: 'bg-violet-600' },
                    { label: 'Education Match (15% weight)', pct: topCand?.education_percentage ?? 100, pts: `${topCand?.score_breakdown?.education_weighted ?? 15.0}/15`, color: 'bg-emerald-600' },
                    { label: 'JD Requirements (15% weight)', pct: topCand?.requirements_percentage ?? 90, pts: `${topCand?.score_breakdown?.requirements_weighted ?? 13.5}/15`, color: 'bg-sky-600' },
                  ].map((b) => (
                    <div key={b.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">{b.label}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {b.pts} pts ({Math.round(b.pct)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${b.color} rounded-full`}
                          style={{ width: `${Math.min(100, b.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Matched vs Missing Skills */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Matched Core Skills:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(topCand?.matched_skills || ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Scikit-Learn', 'TensorFlow', 'FastAPI']).map((sk) => (
                        <span
                          key={sk}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Missing:
                      </span>
                      {(topCand?.missing_skills?.length ? topCand.missing_skills : ['Docker']).map((sk) => (
                        <span
                          key={sk}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-medium"
                        >
                          <XCircle className="w-3 h-3" />
                          {sk}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        topCand ? onInspectCandidate(topCand.id) : onNavigate('results')
                      }
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      Inspect Full AI Analysis
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEMANTIC MATCHING SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-50/60 via-white to-emerald-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Beyond Exact Keyword Matching
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                True Semantic Understanding with Dense Word Vectors
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Traditional ATS filters reject qualified candidates when phrasing differs. TalentPulse combines{' '}
                <strong>spaCy 300-dimensional word embeddings</strong> with <strong>TF-IDF cosine similarity</strong> and domain ontologies to recognize conceptual equivalence.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              <div className="sm:col-span-5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                  Job Description Requirement
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  "Machine Learning Engineer — Experience deploying production predictive models"
                </p>
              </div>

              <div className="sm:col-span-1 flex flex-col items-center justify-center py-2">
                <span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold shadow">
                  92% Sim
                </span>
              </div>

              <div className="sm:col-span-5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-sm">
                <div className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                  Candidate Resume Phrase
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  "Built predictive models using Scikit-Learn and TensorFlow served via FastAPI"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI WORKFLOW VISUALIZATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            End-to-End NLP Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            10-Stage AI Resume Screening Pipeline
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Every uploaded PDF, DOCX, and TXT resume passes through our deterministic + neural NLP pipeline backed by PostgreSQL 17.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {pipelineSteps.map((s) => (
            <div
              key={s.step}
              className="glass-card rounded-xl p-4 hover:border-indigo-500/50 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  STEP {s.step}
                </span>
                <Cpu className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                {s.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ENTERPRISE FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Built for Recruiting Teams
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Complete Candidate Intelligence Suite
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Layers className="w-5 h-5 text-indigo-600" />,
              title: 'Multi-Format Resume Parsing',
              desc: 'Extracts structured text from PDF (PyMuPDF & pdfplumber), Word (.docx), and plain text (.txt) with SHA-256 duplicate detection.',
            },
            {
              icon: <Scale className="w-5 h-5 text-violet-600" />,
              title: 'Configurable Transparent Scoring',
              desc: 'Customize weights across Skills (40%), Experience (25%), Education (15%), Requirements (15%), and Projects (5%) with instant re-ranking.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
              title: 'Zero-Bias Fairness Guard',
              desc: 'Automatically strips gender, religion, caste, race, age, marital status, disability, and photo markers before scoring.',
            },
            {
              icon: <Search className="w-5 h-5 text-sky-600" />,
              title: 'Deep Requirement Comparison',
              desc: 'Inspect requirement-by-requirement match status with exact evidence snippets extracted from each candidate resume.',
            },
            {
              icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
              title: 'Talent Pool Analytics',
              desc: 'Visualize score distributions, skill coverage percentages, experience cohorts, education breakdowns, and missing skill gaps.',
            },
            {
              icon: <Download className="w-5 h-5 text-rose-600" />,
              title: 'One-Click CSV, Excel & PDF Exports',
              desc: 'Download formatted Excel (.xlsx) workbooks, executive PDF reports, and CSV spreadsheets including recruiter notes.',
            },
          ].map((feat) => (
            <div key={feat.title} className="glass-card rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {feat.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            TalentPulse AI — Resume Screening & Candidate Intelligence Platform
          </span>
        </div>
        <p>
          AI-generated screening results are decision-support information only. Recruiters must review candidates and make final decisions.
        </p>
      </footer>
    </div>
  );
};
