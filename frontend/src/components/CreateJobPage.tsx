import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  Sliders,
  Briefcase,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { api } from '../api';
import { Job, JobWeights } from '../types';

interface CreateJobPageProps {
  onJobCreated: (job: Job) => void;
}

const JD_TEMPLATES = [
  {
    label: 'Senior Machine Learning Engineer',
    title: 'Senior Machine Learning Engineer',
    department: 'AI & Data Science',
    location: 'Bengaluru, India (Hybrid)',
    min_experience_years: 4,
    education_level: "Bachelor's",
    description: `Job Title: Senior Machine Learning Engineer
Department: AI & Data Science
Location: Bengaluru, India (Hybrid)
Experience Requirement: 4+ years of industry experience

We are seeking a Senior Machine Learning Engineer to build and deploy production predictive models, NLP pipelines, and real-time inference APIs.

Mandatory Requirements:
• 4+ years of experience building and deploying Machine Learning models in production.
• Strong proficiency in Python, SQL, and data processing using Pandas and NumPy.
• Hands-on expertise with Scikit-Learn and TensorFlow for predictive modeling and deep learning.
• Experience building low-latency REST APIs using FastAPI and containerizing services with Docker.

Preferred Qualifications:
• Experience with Natural Language Processing (NLP), spaCy, Hugging Face, or PyTorch.
• Familiarity with AWS, Kubernetes, and MLOps workflows.`,
  },
  {
    label: 'Lead GenAI & NLP Scientist',
    title: 'Lead GenAI & NLP Scientist',
    department: 'Generative AI Lab',
    location: 'Hyderabad, India (Remote/Hybrid)',
    min_experience_years: 5,
    education_level: 'M.Tech',
    description: `Job Title: Lead GenAI & NLP Scientist
Department: Generative AI Lab
Location: Hyderabad, India
Experience Requirement: 5+ years of experience in NLP and Deep Learning

We are hiring a Lead GenAI & NLP Scientist to lead enterprise LLM fine-tuning, Retrieval-Augmented Generation (RAG) architectures, and semantic search engines.

Mandatory Requirements:
• 5+ years of hands-on experience in Natural Language Processing (NLP), Deep Learning, and Machine Learning.
• Strong coding expertise in Python, PyTorch, Hugging Face Transformers, spaCy, and LangChain.
• Experience with LLMs & GenAI, vector search in PostgreSQL / SQL, and FastAPI model serving.

Preferred Qualifications:
• Experience with Docker, Kubernetes, AWS, and MLOps monitoring.
• Master's (M.Tech / M.S.) or Ph.D. in Computer Science or AI.`,
  },
  {
    label: 'Full-Stack Cloud & Data Engineer',
    title: 'Full-Stack Cloud & Data Platform Engineer',
    department: 'Platform Engineering',
    location: 'Chennai, India (Hybrid)',
    min_experience_years: 3,
    education_level: 'B.Tech',
    description: `Job Title: Full-Stack Cloud & Data Platform Engineer
Department: Platform Engineering
Location: Chennai, India
Experience Requirement: 3+ years of experience

We are looking for a Full-Stack Cloud & Data Platform Engineer to build scalable Python/FastAPI backend services, SQL/PostgreSQL data pipelines, and React/TypeScript web applications.

Mandatory Requirements:
• 3+ years of professional software or data engineering experience.
• Strong proficiency in Python, SQL, PostgreSQL, FastAPI, REST APIs, and Docker.
• Experience deploying applications on AWS with CI/CD pipelines.

Preferred Qualifications:
• Experience with React, TypeScript, Kubernetes, Redis, or Apache Spark.`,
  },
];

export const CreateJobPage: React.FC<CreateJobPageProps> = ({ onJobCreated }) => {
  const [title, setTitle] = useState(JD_TEMPLATES[0].title);
  const [department, setDepartment] = useState(JD_TEMPLATES[0].department);
  const [location, setLocation] = useState(JD_TEMPLATES[0].location);
  const [minExp, setMinExp] = useState<number>(JD_TEMPLATES[0].min_experience_years);
  const [educationLevel, setEducationLevel] = useState(JD_TEMPLATES[0].education_level);
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [description, setDescription] = useState(JD_TEMPLATES[0].description);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    'Python',
    'SQL',
    'Machine Learning',
    'Pandas',
    'Scikit-Learn',
    'TensorFlow',
    'FastAPI',
    'Docker',
  ]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([
    'PyTorch',
    'NLP',
    'AWS',
    'Kubernetes',
    'MLOps',
  ]);
  const [newReqSkill, setNewReqSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');

  const [weights, setWeights] = useState<JobWeights>({
    skills: 40,
    experience: 25,
    education: 15,
    requirements: 15,
    projects: 5,
  });

  const [extractedRequirements, setExtractedRequirements] = useState<
    { category: string; requirement_text: string; is_mandatory: boolean }[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const totalWeight =
    weights.skills +
    weights.experience +
    weights.education +
    weights.requirements +
    weights.projects;

  const handleLoadTemplate = (tpl: (typeof JD_TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setDepartment(tpl.department);
    setLocation(tpl.location);
    setMinExp(tpl.min_experience_years);
    setEducationLevel(tpl.education_level);
    setDescription(tpl.description);
    setMessage(null);
  };

  const handleAutoExtractJD = async () => {
    if (!description || description.trim().length < 20) {
      setMessage({
        type: 'error',
        text: 'Please enter or paste a Job Description (at least 20 characters) before extracting requirements.',
      });
      return;
    }
    setIsExtracting(true);
    setMessage(null);
    try {
      const res = await api.extractRequirements(description, title);
      if (res.title && !title.trim()) setTitle(res.title);
      if (res.department) setDepartment(res.department);
      if (res.location) setLocation(res.location);
      if (res.min_experience_years) setMinExp(res.min_experience_years);
      if (res.education_level) setEducationLevel(res.education_level);
      setRequiredSkills(res.required_skills);
      setPreferredSkills(res.preferred_skills);
      setExtractedRequirements(res.requirements);
      setMessage({
        type: 'success',
        text: `NLP Extractor identified ${res.required_skills.length} required skills, ${res.preferred_skills.length} preferred skills, ${res.min_experience_years}+ yrs experience, and ${res.requirements.length} requirement clauses!`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to extract requirements from JD.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const addSkill = (type: 'req' | 'pref') => {
    if (type === 'req' && newReqSkill.trim()) {
      const v = newReqSkill.trim();
      if (!requiredSkills.includes(v)) {
        setRequiredSkills([...requiredSkills, v]);
      }
      setNewReqSkill('');
    } else if (type === 'pref' && newPrefSkill.trim()) {
      const v = newPrefSkill.trim();
      if (!preferredSkills.includes(v)) {
        setPreferredSkills([...preferredSkills, v]);
      }
      setNewPrefSkill('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setMessage({
        type: 'error',
        text: 'Job Title and Job Description are required.',
      });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const created = await api.createJob({
        title,
        department,
        location,
        min_experience_years: Number(minExp),
        education_level: educationLevel,
        employment_type: employmentType,
        description,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        weights,
      });
      onJobCreated(created);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to create job opening.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            Create Screening Session / Job Opening
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Paste a Job Description and use our AI NLP Extractor to automatically parse required skills, experience, and scoring criteria.
          </p>
        </div>

        {/* Quick Templates */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Quick Templates:</span>
          {JD_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => handleLoadTemplate(tpl)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-2.5 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Job Description & NLP Auto-Extraction */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Job Description & AI Requirement Extraction
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste the raw JD below and click "Auto-Extract Requirements from JD" to populate skills and requirements automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoExtractJD}
              disabled={isExtracting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
              {isExtracting ? 'Running spaCy NLP...' : 'Auto-Extract Requirements from JD'}
            </button>
          </div>

          <textarea
            rows={9}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste complete Job Description here..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 p-3.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono leading-relaxed"
            required
          />

          {extractedRequirements.length > 0 && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl p-4 border border-indigo-200/70 dark:border-indigo-800/60 space-y-2">
              <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Extracted Structured Requirement Statements ({extractedRequirements.length}):
              </div>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {extractedRequirements.slice(0, 6).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                        r.is_mandatory
                          ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.is_mandatory ? 'Mandatory' : 'Preferred'}
                    </span>
                    <span>{r.requirement_text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Step 2: Role Metadata */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Role Details & Experience Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Experience Requirement (Years)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={minExp}
                onChange={(e) => setMinExp(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Bachelor's">Bachelor's / B.Tech / B.E.</option>
                <option value="M.Tech">Master's / M.Tech / M.S.</option>
                <option value="MBA">MBA</option>
                <option value="Ph.D.">Ph.D. / Doctorate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote Full-Time">Remote Full-Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Required & Preferred Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Required Skills */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3A. Required Skills (Core Matching Criteria)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newReqSkill}
                onChange={(e) => setNewReqSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill('req');
                  }
                }}
                placeholder="Add required skill (e.g. Docker, PyTorch)..."
                className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => addSkill('req')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {requiredSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() =>
                      setRequiredSkills(requiredSkills.filter((s) => s !== sk))
                    }
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3B. Preferred Skills (Bonus Weighting)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPrefSkill}
                onChange={(e) => setNewPrefSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill('pref');
                  }
                }}
                placeholder="Add preferred skill (e.g. Kubernetes, AWS)..."
                className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => addSkill('pref')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {preferredSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() =>
                      setPreferredSkills(preferredSkills.filter((s) => s !== sk))
                    }
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Configurable Transparent Scoring Weights */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Configurable Transparent Scoring Weights
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize how each dimension contributes to the 100% Candidate Match Score.
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                totalWeight === 100
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              Total Weight: {totalWeight}% {totalWeight !== 100 && '(Auto-normalized to 100%)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              { key: 'skills', label: 'Skills Match', defaultVal: 40 },
              { key: 'experience', label: 'Experience Match', defaultVal: 25 },
              { key: 'education', label: 'Education Match', defaultVal: 15 },
              { key: 'requirements', label: 'Job Requirements', defaultVal: 15 },
              { key: 'projects', label: 'Certs & Projects', defaultVal: 5 },
            ].map((item) => (
              <div
                key={item.key}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>{item.label}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {weights[item.key as keyof JobWeights]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={weights[item.key as keyof JobWeights]}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      [item.key]: Number(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting
              ? 'Creating Screening Session...'
              : 'Create Job Opening & Proceed to Resume Upload'}
          </button>
        </div>
      </form>
    </div>
  );
};
