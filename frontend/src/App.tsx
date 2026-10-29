import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsBar } from './components/MetricsBar';
import { api } from './services/api';
import { Job, Application, UserProfile, AppSettings, DashboardMetrics } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'queue' | 'tracker'>('feed');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [m, s, a] = await Promise.all([
        api.getMetrics(),
        api.getSettings(),
        api.getApplications(),
      ]);
      setMetrics(m);
      setSettings(s);
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

        {/* Placeholder / Dynamic Tab View */}
        <div id="tab-container">
          {activeTab === 'feed' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Live Job Feed</h2>
              <p className="text-sm text-slate-500 mb-4">Ingested tech jobs matched against your resume.</p>
              <div className="text-center py-12 text-slate-400">Loading job feed components...</div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Review & Apply Queue</h2>
              <p className="text-sm text-slate-500 mb-4">Stage high-match applications for 1-click review and email dispatch.</p>
              <div className="text-center py-12 text-slate-400">Loading review queue components...</div>
            </div>
          )}

          {activeTab === 'tracker' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Applications Tracker</h2>
              <p className="text-sm text-slate-500 mb-4">Full audit history of sent emails and submitted applications.</p>
              <div className="text-center py-12 text-slate-400">Loading applications tracker...</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
