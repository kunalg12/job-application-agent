import React from 'react';
import { Bot, RefreshCw, Zap, Shield, User, Settings as SettingsIcon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'queue' | 'tracker';
  onTabChange: (tab: 'feed' | 'queue' | 'tracker') => void;
  autonomousMode: boolean;
  onScan: () => void;
  isScanning: boolean;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  autonomousMode,
  onScan,
  isScanning,
  onOpenSettings,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 tracking-tight text-lg">Job Hunter Agent</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Autonomous Job Discovery & Outreach Copilot</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onTabChange('feed')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'feed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Job Feed
          </button>
          <button
            onClick={() => onTabChange('queue')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Review & Apply Queue
          </button>
          <button
            onClick={() => onTabChange('tracker')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tracker'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Applications Tracker
          </button>
        </nav>

        {/* Actions & Mode Indicator */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Mode Pill */}
          <div className={`hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            autonomousMode
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {autonomousMode ? <Zap className="w-3.5 h-3.5 text-amber-600" /> : <Shield className="w-3.5 h-3.5 text-slate-500" />}
            <span>{autonomousMode ? 'Auto-Pilot Mode' : 'Supervised (1-Click)'}</span>
          </div>

          {/* Scan Button */}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 active:scale-95 transition-all shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Jobs'}</span>
          </button>

          {/* Profile & Settings Buttons */}
          <button
            onClick={onOpenProfile}
            title="Profile & Resume"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
          
          <button
            onClick={onOpenSettings}
            title="Settings & Credentials"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
