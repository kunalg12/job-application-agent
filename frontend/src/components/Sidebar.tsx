import React from 'react';
import { 
  Briefcase, 
  Target, 
  Globe, 
  Clock, 
  Send, 
  Award, 
  User, 
  Settings as SettingsIcon, 
  Sparkles,
  Zap
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface SidebarProps {
  activeTab: 'feed' | 'queue' | 'tracker';
  onTabChange: (tab: 'feed' | 'queue' | 'tracker') => void;
  queuedCount: number;
  metrics: DashboardMetrics | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onSelectFilter?: (filter: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  queuedCount,
  metrics,
  onOpenProfile,
  onOpenSettings,
  isOpen,
  onSelectFilter,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-[230px] shrink-0 border-r border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.3)] bg-[#F2F2F7]/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl flex flex-col justify-between select-none h-[calc(100vh-52px)] sticky top-[52px]">
      
      {/* Top Navigation Sections */}
      <div className="p-2.5 space-y-4 overflow-y-auto">
        
        {/* SECTION: DISCOVERY */}
        <div>
          <span className="px-2.5 text-[11px] font-semibold text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)] uppercase tracking-wider block mb-1">
            Discover
          </span>
          <nav className="space-y-0.5">
            <button
              onClick={() => onTabChange('feed')}
              className={`w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-[#007AFF] text-white shadow-apple-1'
                  : 'text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Job Feed</span>
              </div>
              <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full ${
                activeTab === 'feed' ? 'bg-white/20 text-white' : 'text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]'
              }`}>
                {metrics ? metrics.total_jobs_discovered : '—'}
              </span>
            </button>

            <button
              onClick={() => {
                onTabChange('feed');
                if (onSelectFilter) onSelectFilter('highMatch');
              }}
              className="w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center justify-between text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)] transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Target className="w-3.5 h-3.5 text-[#34C759] dark:text-[#30D158]" strokeWidth={1.75} />
                <span>High Fit (&ge;80%)</span>
              </div>
              <span className="text-[11px] font-semibold text-[#34C759] dark:text-[#30D158]">
                {metrics ? metrics.high_matches : '—'}
              </span>
            </button>

            <button
              onClick={() => {
                onTabChange('feed');
                if (onSelectFilter) onSelectFilter('remote');
              }}
              className="w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center space-x-2 text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)] transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#0A84FF]" strokeWidth={1.75} />
              <span>Remote Worldwide</span>
            </button>
          </nav>
        </div>

        {/* SECTION: PIPELINE */}
        <div>
          <span className="px-2.5 text-[11px] font-semibold text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)] uppercase tracking-wider block mb-1">
            Pipeline
          </span>
          <nav className="space-y-0.5">
            <button
              onClick={() => onTabChange('queue')}
              className={`w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-[#007AFF] text-white shadow-apple-1'
                  : 'text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Review Queue</span>
              </div>
              {queuedCount > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-[#FF9500]/15 text-[#FF9500] dark:text-[#FF9F0A]'
                }`}>
                  {queuedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('tracker')}
              className={`w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-[#007AFF] text-white shadow-apple-1'
                  : 'text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Applications</span>
              </div>
              <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full ${
                activeTab === 'tracker' ? 'bg-white/20 text-white' : 'text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]'
              }`}>
                {metrics ? metrics.sent_total : '0'}
              </span>
            </button>
          </nav>
        </div>

        {/* SECTION: SYSTEM */}
        <div>
          <span className="px-2.5 text-[11px] font-semibold text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)] uppercase tracking-wider block mb-1">
            System
          </span>
          <nav className="space-y-0.5">
            <button
              onClick={onOpenProfile}
              className="w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center space-x-2 text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)] transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]" strokeWidth={1.75} />
              <span>Resume & Profile</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="w-full h-8 px-2.5 rounded-[8px] text-[13px] font-medium flex items-center space-x-2 text-black dark:text-white hover:bg-[rgba(120,120,128,0.10)] transition-all cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]" strokeWidth={1.75} />
              <span>Outreach Settings</span>
            </button>
          </nav>
        </div>

      </div>

      {/* Bottom Dispatch Progress Widget */}
      <div className="p-3 border-t border-[rgba(60,60,67,0.10)] dark:border-[rgba(84,84,88,0.3)] bg-white/40 dark:bg-black/30 m-2 rounded-[12px] shadow-apple-1">
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-black dark:text-white">
          <span className="flex items-center">
            <Zap className="w-3 h-3 mr-1 text-[#FF9500]" strokeWidth={2} /> Daily Quota
          </span>
          <span>{metrics ? metrics.sent_today : 0} / {metrics ? metrics.daily_limit : 20}</span>
        </div>
        <div className="w-full h-1.5 bg-[rgba(120,120,128,0.15)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#007AFF] to-[#34C759] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (((metrics?.sent_today || 0) / (metrics?.daily_limit || 20)) * 100))}%` }}
          />
        </div>
        <span className="text-[10px] text-[rgba(60,60,67,0.55)] dark:text-[rgba(235,235,245,0.55)] block mt-1">
          Anti-spam protection active
        </span>
      </div>

    </aside>
  );
};
