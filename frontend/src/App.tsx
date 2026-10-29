import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsBar } from './components/MetricsBar';
import { JobFeed } from './components/JobFeed';
import { ReviewQueue } from './components/ReviewQueue';
import { ApplicationsTracker } from './components/ApplicationsTracker';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { api } from './services/api';
import { Job, Application, UserProfile, AppSettings, DashboardMetrics } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'queue' | 'tracker'>('feed');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        autonomousMode={settings?.autonomous_mode || false}
        onScan={handleScan}
        isScanning={isScanning}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <MetricsBar metrics={metrics} queuedCount={queuedApps.length} />

        {activeTab === 'feed' && (
          <JobFeed
            jobs={jobs}
            onStageJob={handleStageJob}
            onImportJob={handleImportJob}
            stagedJobIds={stagedJobIds}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
        onUploadResume={handleUploadResume}
      />
    </div>
  );
};

export default App;
