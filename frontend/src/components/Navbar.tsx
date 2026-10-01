import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  UploadCloud,
  Users,
  BarChart3,
  Sun,
  Moon,
  RotateCcw,
  UserCheck,
  Briefcase,
  Home,
} from 'lucide-react';
import { PageView, Job, User } from '../types';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  jobs: Job[];
  selectedJobId: number;
  onSelectJob: (jobId: number) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  jobs,
  selectedJobId,
  onSelectJob,
  darkMode,
  onToggleDark,
  user,
  onOpenAuth,
  onResetDemo,
  isResetting,
}) => {
  const navItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'create-job', label: 'Create Job', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload Resumes', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'results', label: 'Candidate Ranking', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  TalentPulse
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  AI Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Resume Screening & Ranking Engine
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {navItems.map((item) => {
              const isActive =
                currentPage === item.id ||
                (currentPage === 'detail' && item.id === 'results');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Active Job Selector, Demo Reset, Theme, Auth */}
          <div className="flex items-center gap-2">
            {jobs.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <select
                  value={selectedJobId}
                  onChange={(e) => onSelectJob(Number(e.target.value))}
                  aria-label="Active Screening Job"
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none max-w-[190px] truncate cursor-pointer"
                >
                  {jobs.map((j) => (
                    <option
                      key={j.id}
                      value={j.id}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      {j.title} ({j.candidate_count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onResetDemo}
              disabled={isResetting}
              title="Reset & Re-run 10-Candidate Demo Dataset"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">
                {isResetting ? 'Resetting...' : 'Reset Demo'}
              </span>
            </button>

            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {user ? user.full_name.split(' ')[0] : 'Recruiter Sign In'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Secondary Navigation Bar */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-200/60 dark:border-slate-800/60">
          {navItems.map((item) => {
            const isActive =
              currentPage === item.id ||
              (currentPage === 'detail' && item.id === 'results');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
