import React from 'react';
import { Briefcase, Target, Clock, Send } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface MetricsBarProps {
  metrics: DashboardMetrics | null;
  queuedCount: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, queuedCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      
      {/* Discovered Jobs */}
      <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] transition-all hover:shadow-apple-3">
        <div className="flex items-center justify-between text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Discovered</span>
          <div className="w-7 h-7 rounded-[8px] bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
            <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-[26px] font-bold tracking-tight text-black dark:text-white">
          {metrics ? metrics.total_jobs_discovered : '—'}
        </div>
        <p className="text-[12px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] mt-0.5">
          Ingested tech openings
        </p>
      </div>

      {/* High Fit Matches */}
      <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] transition-all hover:shadow-apple-3">
        <div className="flex items-center justify-between text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase">High Match</span>
          <div className="w-7 h-7 rounded-[8px] bg-[#34C759]/10 flex items-center justify-center text-[#34C759] dark:text-[#30D158]">
            <Target className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-[26px] font-bold tracking-tight text-black dark:text-white">
          {metrics ? metrics.high_matches : '—'}
        </div>
        <p className="text-[12px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] mt-0.5">
          Fit score &ge; 80%
        </p>
      </div>

      {/* Staged in Review Queue */}
      <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] transition-all hover:shadow-apple-3">
        <div className="flex items-center justify-between text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Review Queue</span>
          <div className="w-7 h-7 rounded-[8px] bg-[#5856D6]/10 flex items-center justify-center text-[#5856D6] dark:text-[#5E5CE6]">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-[26px] font-bold tracking-tight text-black dark:text-white">
          {queuedCount}
        </div>
        <p className="text-[12px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] mt-0.5">
          Ready for 1-click apply
        </p>
      </div>

      {/* Dispatched Applications */}
      <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[16px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] transition-all hover:shadow-apple-3">
        <div className="flex items-center justify-between text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Sent Today</span>
          <div className="w-7 h-7 rounded-[8px] bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] dark:text-[#FF9F0A]">
            <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-[26px] font-bold tracking-tight text-black dark:text-white">
            {metrics ? metrics.sent_today : 0}
          </span>
          <span className="text-[13px] font-medium text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)]">
            / {metrics ? metrics.daily_limit : 20} limit
          </span>
        </div>
        <p className="text-[12px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] mt-0.5">
          {metrics ? `${metrics.sent_total} total applications sent` : 'Protected rate limit'}
        </p>
      </div>

    </div>
  );
};
