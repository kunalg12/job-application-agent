import React from 'react';
import { Bot, RefreshCw, Zap, Shield, User, Settings as SettingsIcon, PanelLeft, Search } from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'queue' | 'tracker';
  onTabChange: (tab: 'feed' | 'queue' | 'tracker') => void;
  autonomousMode: boolean;
  onScan: () => void;
  isScanning: boolean;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  autonomousMode,
  onScan,
  isScanning,
  onOpenSettings,
  onOpenProfile,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-40 material-regular border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] transition-colors select-none">
      <div className="px-4 sm:px-6 h-[52px] flex items-center justify-between">
        
        {/* Left: macOS Window Traffic Lights & App Title */}
        <div className="flex items-center space-x-3.5">
          {/* macOS Window Controls */}
          <div className="hidden sm:flex items-center space-x-2 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block shadow-2xs"></span>
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block shadow-2xs"></span>
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block shadow-2xs"></span>
          </div>

          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer ${
              sidebarOpen 
                ? 'bg-[rgba(0,122,255,0.12)] text-[#007AFF] dark:text-[#0A84FF]' 
                : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:bg-[rgba(120,120,128,0.12)]'
            }`}
            title="Toggle Sidebar (⌘B)"
          >
            <PanelLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {/* App Icon Squircle & Title */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-gradient-to-b from-[#007AFF] to-[#0051D5] flex items-center justify-center text-white shadow-apple-1">
              <Bot className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[15px] tracking-tight text-black dark:text-white">
                Job Hunter
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold bg-[#34C759]/12 text-[#34C759] dark:bg-[#30D158]/18 dark:text-[#30D158]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] dark:bg-[#30D158] mr-1 animate-pulse"></span>
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Center: macOS Style Segmented Control Tab Switcher */}
        <nav className="flex items-center bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] p-0.5 rounded-[8px] space-x-0.5">
          <button
            onClick={() => onTabChange('feed')}
            className={`px-3 py-1 rounded-[6px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1'
                : 'text-[rgba(60,60,67,0.75)] dark:text-[rgba(235,235,245,0.75)] hover:text-black dark:hover:text-white'
            }`}
          >
            Job Feed
          </button>
          <button
            onClick={() => onTabChange('queue')}
            className={`px-3 py-1 rounded-[6px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1'
                : 'text-[rgba(60,60,67,0.75)] dark:text-[rgba(235,235,245,0.75)] hover:text-black dark:hover:text-white'
            }`}
          >
            Review Queue
          </button>
          <button
            onClick={() => onTabChange('tracker')}
            className={`px-3 py-1 rounded-[6px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1'
                : 'text-[rgba(60,60,67,0.75)] dark:text-[rgba(235,235,245,0.75)] hover:text-black dark:hover:text-white'
            }`}
          >
            Applications
          </button>
        </nav>

        {/* Right: Actions & Preferences */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          
          {/* Mode Pill Badge */}
          <div className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
            autonomousMode
              ? 'bg-[#FF9500]/12 text-[#FF9500] dark:bg-[#FF9F0A]/18 dark:text-[#FF9F0A]'
              : 'bg-[rgba(120,120,128,0.12)] text-[rgba(60,60,67,0.85)] dark:text-[rgba(235,235,245,0.85)]'
          }`}>
            {autonomousMode ? (
              <Zap className="w-3.5 h-3.5 text-[#FF9500] dark:text-[#FF9F0A]" strokeWidth={1.75} />
            ) : (
              <Shield className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={1.75} />
            )}
            <span>{autonomousMode ? 'Auto-Pilot' : 'Supervised'}</span>
          </div>

          {/* Scan Remote Boards */}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="btn-apple-secondary text-[12px] px-3 py-1.5 h-7.5 gap-1.5 cursor-pointer disabled:opacity-50"
            title="Scan Remote Job Boards"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Jobs'}</span>
          </button>

          {/* Profile Modal Trigger */}
          <button
            onClick={onOpenProfile}
            className="w-7.5 h-7.5 rounded-full bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)] text-black dark:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Candidate Profile & Resume"
          >
            <User className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-7.5 h-7.5 rounded-full bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)] text-black dark:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Gateway & Automation Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>

      </div>
    </header>
  );
};
