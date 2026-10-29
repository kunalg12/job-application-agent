import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MetricsBar } from './components/MetricsBar';
import { JobFeed } from './components/JobFeed';
import { ReviewQueue } from './components/ReviewQueue';
import { ApplicationsTracker } from './components/ApplicationsTracker';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { api } from './services/api';
import { Job, Application, UserProfile, AppSettings, DashboardMetrics } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'queue' | 'tracker'>('feed');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedFilterPreset, setFeedFilterPreset] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [selectedCompanyForRecorder, setSelectedCompanyForRecorder] = useState('');

  const loadData = async () => {
    try {
      const [j, m, s, p, a] = await Promise.all([
        api.getJobs(),
        api.getMetrics(),
        api.getSettings(),
        api.getProfile(),
        api.getApplications(),
      ]);
      setJobs(j);
      setMetrics(m);
      setSettings(s);
      setProfile(p);
      setApplications(a);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await api.triggerScan();
      setTimeout(loadData, 3000);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  const handleStageJob = async (jobId: string) => {
    try {
      const app = await api.stageJob(jobId);
      setApplications((prev) => [app, ...prev.filter((a) => a.id !== app.id)]);
      setActiveTab('queue');
      loadData();
    } catch (err) {
      console.error('Failed to stage job:', err);
    }
  };

  const handleImportJob = async (jobData: any) => {
    await api.importJob(jobData);
    await loadData();
  };

  const handleSendEmail = async (appId: string, payload: any) => {
    await api.sendEmail(appId, payload);
    await loadData();
  };

  const handleAutofill = async (appId: string) => {
    await api.autofillApplication(appId, false);
    await loadData();
  };

  const handleUpdateApplication = async (appId: string, payload: any) => {
    await api.updateApplication(appId, payload);
    await loadData();
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
    await loadData();
  };

  const handleSaveProfile = async (newProfile: UserProfile) => {
    const updated = await api.updateProfile(newProfile);
    setProfile(updated);
    await loadData();
  };

  const handleUploadResume = async (file: File) => {
    const updated = await api.uploadResume(file);
    setProfile(updated);
    await loadData();
  };

  const stagedJobIds = new Set(applications.map((a) => a.job_id));
  const queuedApps = applications.filter(a => a.status === 'STAGED' || a.status === 'ACTION_REQUIRED');

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] flex flex-col text-black dark:text-white antialiased font-sans transition-colors">
      
      {/* macOS Top Window Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        autonomousMode={settings?.autonomous_mode || false}
        onScan={handleScan}
        isScanning={isScanning}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenVoiceRecorder={() => {
          setSelectedCompanyForRecorder('');
          setVoiceRecorderOpen(true);
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main macOS Split View Layout */}
      <div className="flex-1 flex overflow-hidden w-full">
        
        {/* macOS Translucent Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          queuedCount={queuedApps.length}
          metrics={metrics}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          isOpen={sidebarOpen}
          onSelectFilter={(filter) => {
            setFeedFilterPreset(filter);
            setTimeout(() => setFeedFilterPreset(null), 500);
          }}
        />

        {/* Primary Content Stage */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 w-full max-w-7xl mx-auto">
          
          {/* Apple Large Title & Breadcrumb */}
          <div className="mb-6">
            <span className="text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] tracking-wide uppercase">
              {activeTab === 'feed' ? 'Job Discovery Engine' : activeTab === 'queue' ? 'Staged Review & Outreach' : 'Pipeline Tracker'}
            </span>
            <h1 className="text-[30px] font-bold tracking-tight text-black dark:text-white mt-0.5">
              {activeTab === 'feed' ? 'Explore Openings' : activeTab === 'queue' ? 'Review & Apply' : 'Applications History'}
            </h1>
            <p className="text-[13px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)] mt-0.5">
              {activeTab === 'feed' 
                ? 'Curated tech and AI jobs matched specifically against your engineering resume.' 
                : activeTab === 'queue' 
                ? 'Inspect tailored cold outreach emails and formatted PDF cover letters before sending.' 
                : 'Monitor responses, outreach logs, and interview progress across all companies.'}
            </p>
          </div>

          {/* Apple Stat Metric Tiles */}
          <MetricsBar metrics={metrics} queuedCount={queuedApps.length} />

          {/* Tab Views */}
          {activeTab === 'feed' && (
            <JobFeed
              jobs={jobs}
              onStageJob={handleStageJob}
              onImportJob={handleImportJob}
              stagedJobIds={stagedJobIds}
              presetFilter={feedFilterPreset}
            />
          )}

          {activeTab === 'queue' && (
            <ReviewQueue
              applications={applications}
              onSendEmail={handleSendEmail}
              onAutofill={handleAutofill}
              onUpdateApplication={handleUpdateApplication}
            />
          )}

          {activeTab === 'tracker' && (
            <ApplicationsTracker
              applications={applications}
              onUpdateStatus={async (appId, status) => {
                await handleUpdateApplication(appId, { status: status as any });
              }}
            />
          )}
        </main>

      </div>

      {/* Settings Modal Sheet */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Profile Modal Sheet */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
        onUploadResume={handleUploadResume}
      />

      {/* Voice Recorder Modal Sheet */}
      <VoiceRecorderModal
        isOpen={voiceRecorderOpen}
        onClose={() => setVoiceRecorderOpen(false)}
        defaultCompany={selectedCompanyForRecorder}
        onRoundSaved={() => loadData()}
      />
    </div>
  );
};

export default App;
