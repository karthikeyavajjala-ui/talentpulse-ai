import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api';
import { Job, CandidateSummary, PageView } from '../types';

interface UploadResumesPageProps {
  jobs: Job[];
  selectedJobId: number;
  onSelectJob: (jobId: number) => void;
  onUploadComplete: () => void;
  onNavigate: (page: PageView) => void;
  onInspectCandidate: (candidateId: number) => void;
}

const SAMPLE_BROWSER_RESUMES = [
  {
    name: 'Siddharth_Rao_ML_Architect.txt',
    content: `SIDDHARTH RAO
Email: siddharth.rao@aiarchitect.in | Phone: +91 98451 77889 | Location: Bengaluru, India
Current Role: Principal Machine Learning Architect

SUMMARY
Principal Machine Learning Engineer with 7 years of experience building production ML pipelines, deep learning models, and FastAPI microservices using Python, SQL, Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, Docker, Kubernetes, and AWS.

WORK EXPERIENCE
Principal Machine Learning Engineer | DeepSense Tech | Jan 2021 - Present
• Built predictive models using Scikit-Learn, TensorFlow, and PyTorch for enterprise personalization and fraud scoring.
• Engineered scalable data pipelines with Python, SQL, PostgreSQL, Pandas, and Apache Spark.
• Deployed low-latency inference services with FastAPI, Docker, and Kubernetes on AWS with MLOps automation.

Machine Learning Engineer | DataCore India | Jun 2019 - Dec 2020
• Built NLP entity extraction systems using spaCy, Hugging Face, and LLMs & GenAI.

EDUCATION
M.Tech in Artificial Intelligence | Indian Institute of Science (IISc), Bengaluru | 2019 | CGPA: 9.4/10

SKILLS
Python, SQL, PostgreSQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, FastAPI, REST APIs, Docker, Kubernetes, NLP, spaCy, Hugging Face, LLMs & GenAI, AWS, MLOps, A/B Testing

CERTIFICATIONS
• AWS Certified Machine Learning - Specialty
• Google Cloud Professional Machine Learning Engineer
• Certified Kubernetes Administrator (CKA)

PROJECTS
• Real-Time LLM & Predictive Scoring Engine: Built hybrid Scikit-Learn + TensorFlow + FastAPI microservice containerized with Docker.
`,
  },
  {
    name: 'Neha_Kulkarni_Data_Scientist.txt',
    content: `NEHA KULKARNI
Email: neha.kulkarni@datascience.in | Phone: +91 97654 32109 | Location: Pune, India
Current Role: Senior Data Scientist

SUMMARY
Senior Data Scientist with 4.5 years of experience in statistical modeling, Python, SQL, Pandas, NumPy, Scikit-Learn, TensorFlow, and NLP.

WORK EXPERIENCE
Senior Data Scientist | FinOptima Analytics | Apr 2022 - Present
• Built predictive churn and credit risk models using Python, Scikit-Learn, TensorFlow, and Pandas.
• Designed SQL and PostgreSQL feature engineering workflows and A/B testing suites.

EDUCATION
M.S. in Data Science | IIT Hyderabad | 2021 | CGPA: 8.8/10

SKILLS
Python, SQL, PostgreSQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-Learn, TensorFlow, NLP, spaCy, A/B Testing, Tableau

CERTIFICATIONS
• TensorFlow Developer Certificate

PROJECTS
• Customer Propensity Engine: Built end-to-end Scikit-Learn and Pandas pipeline predicting conversion probability.
`,
  },
];

export const UploadResumesPage: React.FC<UploadResumesPageProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onUploadComplete,
  onNavigate,
  onInspectCandidate,
}) => {
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    processed_count: number;
    error_count: number;
    processed_candidates: CandidateSummary[];
    errors: { filename: string; error_code: string; message: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const validateAndAddFiles = (incoming: FileList | File[]) => {
    const newErrors: string[] = [];
    const validToAdd: File[] = [];
    const allowedExts = ['pdf', 'docx', 'txt'];
    const maxBytes = 10 * 1024 * 1024;

    Array.from(incoming).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(ext)) {
        newErrors.push(
          `Unsupported format for "${file.name}". Only PDF, DOCX, and TXT files are supported.`
        );
        return;
      }
      if (file.size === 0) {
        newErrors.push(`File "${file.name}" is empty (0 bytes).`);
        return;
      }
      if (file.size > maxBytes) {
        newErrors.push(`File "${file.name}" exceeds the 10 MB size limit.`);
        return;
      }
      if (queuedFiles.some((qf) => qf.name === file.name && qf.size === file.size)) {
        newErrors.push(`File "${file.name}" is already in the upload queue.`);
        return;
      }
      validToAdd.push(file);
    });

    if (newErrors.length > 0) {
      setClientErrors((prev) => [...prev, ...newErrors]);
    }
    if (validToAdd.length > 0) {
      setQueuedFiles((prev) => [...prev, ...validToAdd]);
    }
  };

  const handleAddSampleBrowserResumes = () => {
    const generated = SAMPLE_BROWSER_RESUMES.map(
      (s) => new File([s.content], s.name, { type: 'text/plain' })
    );
    validateAndAddFiles(generated);
  };

  const handleRemoveFile = (index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessUpload = async () => {
    if (!currentJob || queuedFiles.length === 0) return;
    setIsUploading(true);
    setClientErrors([]);
    setUploadResult(null);
    setPipelineStage(1);

    const timer1 = setTimeout(() => setPipelineStage(2), 350);
    const timer2 = setTimeout(() => setPipelineStage(3), 700);
    const timer3 = setTimeout(() => setPipelineStage(4), 1050);

    try {
      const res = await api.uploadResumes(currentJob.id, queuedFiles);
      setPipelineStage(5);
      setUploadResult(res);
      setQueuedFiles([]);
      onUploadComplete();
    } catch (err: any) {
      setClientErrors([err.message || 'Failed to upload and process resumes.']);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsUploading(false);
    }
  };

  const handleLoadServerDemoBatch = async () => {
    if (!currentJob) return;
    setIsUploading(true);
    setClientErrors([]);
    try {
      const res = await api.loadDemoResumesIntoJob(currentJob.id);
      onUploadComplete();
      setClientErrors([]);
      alert(res.message);
      onNavigate('results');
    } catch (err: any) {
      setClientErrors([err.message || 'Failed to load demo resumes.']);
    } finally {
      setIsUploading(false);
    }
  };

  const stages = [
    '1. Multi-Format Document Extraction (PyMuPDF / python-docx / UTF-8)',
    '2. Fairness Guard Sanitization (Redacting Protected Demographic Traits)',
    '3. spaCy NLP Entity Extraction (Skills, Experience, Education, Projects)',
    '4. 300-D Neural Vector + TF-IDF Semantic Similarity Matching',
    '5. Weighted Scoring & Candidate Ranking Complete',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-7 h-7 text-indigo-600" />
            Upload & Process Candidate Resumes
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upload multiple PDF, DOCX, or TXT resumes for automated NLP extraction, semantic matching, and ranking.
          </p>
        </div>

        {/* Target Job Selector */}
        {jobs.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Target Job:</label>
            <select
              value={selectedJobId}
              onChange={(e) => onSelectJob(Number(e.target.value))}
              className="rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.candidate_count} candidates)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Job Requirement Context Card */}
      {currentJob && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-indigo-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
              Active Screening Target
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {currentJob.title} • {currentJob.department} ({currentJob.location})
            </h2>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentJob.required_skills.map((sk) => (
                <span
                  key={sk}
                  className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold"
                >
                  Req: {sk}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddSampleBrowserResumes}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Add 2 Sample Resumes to Queue
            </button>
            <button
              type="button"
              onClick={handleLoadServerDemoBatch}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Batch-Load 10 Demo PDF/DOCX/TXT Resumes
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            validateAndAddFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-card rounded-2xl p-10 border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            if (e.target.files) {
              validateAndAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Drag & drop candidate resumes here, or click to browse
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Supports <strong>PDF (.pdf)</strong>, <strong>Microsoft Word (.docx)</strong>, and{' '}
          <strong>Plain Text (.txt)</strong> up to 10 MB per file. Automatic SHA-256 duplicate detection enabled.
        </p>
      </div>

      {/* Validation Errors */}
      {clientErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              File Validation Notice
            </span>
            <button
              onClick={() => setClientErrors([])}
              className="text-xs text-rose-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-0.5">
            {clientErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Queued Files List */}
      {queuedFiles.length > 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Ready to Screen ({queuedFiles.length} file{queuedFiles.length > 1 ? 's' : ''})
            </h3>
            <button
              onClick={() => setQueuedFiles([])}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Clear Queue
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {queuedFiles.map((file, idx) => {
              const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                      {ext}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • Validated for NLP Pipeline
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleProcessUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
              {isUploading
                ? 'Running AI Resume Screening Pipeline...'
                : `Process & Score ${queuedFiles.length} Resume${queuedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Live Pipeline Progress Tracker */}
      {isUploading && (
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-spin" />
              Executing AI/NLP Screening Pipeline...
            </span>
            <span className="text-xs font-bold text-slate-500">
              Stage {pipelineStage} of 5
            </span>
          </div>
          <div className="space-y-2">
            {stages.map((st, idx) => {
              const active = pipelineStage >= idx + 1;
              return (
                <div
                  key={st}
                  className={`flex items-center gap-2.5 text-xs p-2 rounded-lg ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      active ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                  <span>{st}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Results Report */}
      {uploadResult && (
        <div className="glass-card rounded-2xl p-6 space-y-5 border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Batch Screening Completed: {uploadResult.processed_count} Processed,{' '}
                  {uploadResult.error_count} Skipped/Flagged
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Protected characteristics automatically redacted prior to scoring.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('results')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
            >
              <span>View Full Ranked Candidate Table</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {uploadResult.processed_candidates.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                Newly Scored & Ranked Candidates:
              </div>
              {uploadResult.processed_candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-xs font-extrabold">
                        Rank #{cand.rank}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {cand.full_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({cand.resume_file_name})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {cand.explanation_summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {Math.round(cand.overall_score)}%
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        {cand.recommendation}
                      </div>
                    </div>
                    <button
                      onClick={() => onInspectCandidate(cand.id)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
                    >
                      Inspect AI Analysis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadResult.errors.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-rose-600">
                Skipped / Invalid Files ({uploadResult.errors.length}):
              </div>
              {uploadResult.errors.map((err, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200"
                >
                  <strong>[{err.error_code}] {err.filename}:</strong> {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
