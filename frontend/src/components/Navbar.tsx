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
    <header className="sticky top-0 z-40 material-regular border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand with Apple Squircle */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-apple-1">
            <Bot className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[16px] tracking-tight text-black dark:text-white">
                Job Hunter
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[11px] font-medium bg-[#34C759]/10 text-[#34C759] dark:bg-[#30D158]/15 dark:text-[#30D158]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] dark:bg-[#30D158] mr-1 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* macOS Style Segmented Control Tab Navigation */}
        <nav className="hidden md:flex items-center bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] p-0.5 rounded-[10px] space-x-0.5">
          <button
            onClick={() => onTabChange('feed')}
            className={`px-3 py-1 rounded-[8px] text-[13px] font-medium transition-all duration-150 ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1'
                : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:text-black dark:hover:text-white'
            }`}
          >
            Job Feed
          </button>
          <button
            onClick={() => onTabChange('queue')}
            className={`px-3 py-1 rounded-[8px] text-[13px] font-medium transition-all duration-150 ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1'
                : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:text-black dark:hover:text-white'
            }`}
          >
            Review Queue
          </button>
          <button
            onClick={() => onTabChange('tracker')}
            className={`px-3 py-1 rounded-[8px] text-[13px] font-medium transition-all duration-150 ${
              activeTab === 'tracker'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1'
                : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:text-black dark:hover:text-white'
            }`}
          >
            Applications Tracker
          </button>
        </nav>

        {/* Actions & Mode Indicator */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Mode Pill */}
          <div className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors ${
            autonomousMode
              ? 'bg-[#FF9500]/10 text-[#FF9500] dark:bg-[#FF9F0A]/15 dark:text-[#FF9F0A]'
              : 'bg-[rgba(120,120,128,0.12)] text-[rgba(60,60,67,0.85)] dark:text-[rgba(235,235,245,0.85)]'
          }`}>
            {autonomousMode ? (
              <Zap className="w-3.5 h-3.5 text-[#FF9500] dark:text-[#FF9F0A]" strokeWidth={1.75} />
            ) : (
              <Shield className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={1.75} />
            )}
            <span>{autonomousMode ? 'Auto-Pilot Mode' : 'Supervised (1-Click)'}</span>
          </div>

          {/* Scan Button */}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="btn-apple-secondary text-[13px] px-3 py-1.5 h-8 gap-1.5 cursor-pointer disabled:opacity-50"
            title="Scan remote job boards"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Jobs'}</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)] text-black dark:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Profile & Resume"
          >
            <User className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)] text-black dark:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Outreach Settings"
          >
            <SettingsIcon className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

      </div>
    </header>
  );
};
