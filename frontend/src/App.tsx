import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { PageView, Job, DashboardStats, User } from './types';
import { FairnessBanner } from './components/FairnessBanner';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage';
import { CreateJobPage } from './components/CreateJobPage';
import { UploadResumesPage } from './components/UploadResumesPage';
import { CandidateResultsPage } from './components/CandidateResultsPage';
import { CandidateDetailPage } from './components/CandidateDetailPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number>(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const refreshData = useCallback(async () => {
    try {
      const [statsRes, jobsRes, meRes] = await Promise.all([
        api.getDashboardStats(),
        api.listJobs(),
        api.getMe().catch(() => null),
      ]);
      setStats(statsRes);
      setJobs(jobsRes);
      if (meRes) setUser(meRes);
      if (jobsRes.length > 0) {
        setSelectedJobId((prev) =>
          prev && jobsRes.some((j) => j.id === prev) ? prev : jobsRes[0].id
        );
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleInspectCandidate = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJobAndNavigate = (jobId: number, page: PageView) => {
    setSelectedJobId(jobId);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      await refreshData();
      if (res.primary_job_id) {
        setSelectedJobId(res.primary_job_id);
      }
      setCurrentPage('results');
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo dataset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Persistent Ethical AI & Fairness Disclaimer Banner */}
      <FairnessBanner />

      {/* Main Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelectJob={(jobId) => setSelectedJobId(jobId)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Page Router */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={(p) => setCurrentPage(p)}
            onInspectCandidate={handleInspectCandidate}
            stats={stats}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            stats={stats}
            onNavigate={(p) => setCurrentPage(p)}
            onSelectJobAndNavigate={handleSelectJobAndNavigate}
            onInspectCandidate={handleInspectCandidate}
          />
        )}

        {currentPage === 'create-job' && (
          <CreateJobPage
            onJobCreated={async (newJob) => {
              await refreshData();
              setSelectedJobId(newJob.id);
              setCurrentPage('upload');
            }}
          />
        )}

        {currentPage === 'upload' && (
          <UploadResumesPage
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={(id) => setSelectedJobId(id)}
            onUploadComplete={refreshData}
            onNavigate={(p) => setCurrentPage(p)}
            onInspectCandidate={handleInspectCandidate}
          />
        )}

        {currentPage === 'results' && (
          <CandidateResultsPage
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={(id) => setSelectedJobId(id)}
            onInspectCandidate={handleInspectCandidate}
            onNavigate={(p) => setCurrentPage(p)}
            onJobsUpdated={refreshData}
          />
        )}

        {currentPage === 'detail' && (
          <CandidateDetailPage
            candidateId={selectedCandidateId || stats?.top_candidates?.[0]?.id || 1}
            onBack={() => setCurrentPage('results')}
            onCandidateUpdated={refreshData}
          />
        )}

        {currentPage === 'analytics' && (
          <AnalyticsPage
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={(id) => setSelectedJobId(id)}
          />
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          user={user}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(u) => setUser(u)}
        />
      )}
    </div>
  );
};

export default App;
