import React from 'react';
import { Briefcase, Target, Clock, Send, ShieldCheck } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface MetricsBarProps {
  metrics: DashboardMetrics | null;
  queuedCount: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, queuedCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      
      {/* Discovered Jobs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Discovered</span>
          <Briefcase className="w-4 h-4 text-sky-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {metrics ? metrics.total_jobs_discovered : '—'}
        </div>
        <p className="text-xs text-slate-500 mt-1">Multi-board ingested tech jobs</p>
      </div>

      {/* High Fit Matches */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">High Match (≥80%)</span>
          <Target className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {metrics ? metrics.high_matches : '—'}
        </div>
        <p className="text-xs text-slate-500 mt-1">Tailored for your resume profile</p>
      </div>

      {/* Staged in Review Queue */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Ready to Review</span>
          <Clock className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {queuedCount}
        </div>
        <p className="text-xs text-slate-500 mt-1">Prepared cover letter & cold email</p>
      </div>

      {/* Dispatched Applications */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Sent Today</span>
          <Send className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-slate-900">
            {metrics ? metrics.sent_today : 0}
          </span>
          <span className="text-xs font-medium text-slate-400">
            / {metrics ? metrics.daily_limit : 20} daily cap
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {metrics ? `${metrics.sent_total} total applications sent` : 'Protected rate limit'}
        </p>
      </div>

    </div>
  );
};
