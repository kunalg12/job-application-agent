import React, { useState } from 'react';
import { Mail, Globe, CheckCircle2, Clock, AlertCircle, XCircle, Award, Sparkles } from 'lucide-react';
import { Application } from '../types';
import { CompanyRoundsTimeline } from './CompanyRoundsTimeline';

interface ApplicationsTrackerProps {
  applications: Application[];
  onUpdateStatus: (appId: string, status: string) => Promise<void>;
  onOpenVoiceRecorder?: (company: string) => void;
}

export const ApplicationsTracker: React.FC<ApplicationsTrackerProps> = ({
  applications,
  onUpdateStatus,
  onOpenVoiceRecorder,
}) => {
  const [timelineCompany, setTimelineCompany] = useState<string | null>(null);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EMAIL_SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]">
            <CheckCircle2 className="w-3 h-3 mr-1" strokeWidth={2} /> Email Sent
          </span>
        );
      case 'FORM_APPLIED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]">
            <Globe className="w-3 h-3 mr-1" strokeWidth={1.75} /> ATS Applied
          </span>
        );
      case 'INTERVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#AF52DE]/15 text-[#AF52DE] dark:text-[#BF5AF2]">
            <Award className="w-3 h-3 mr-1" strokeWidth={1.75} /> Interviewing
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#FF3B30]/15 text-[#FF3B30] dark:text-[#FF453A]">
            <XCircle className="w-3 h-3 mr-1" strokeWidth={1.75} /> Rejected
          </span>
        );
      case 'ACTION_REQUIRED':
      case 'UNROUTABLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#FF9500]/15 text-[#FF9500] dark:text-[#FF9F0A]">
            <AlertCircle className="w-3 h-3 mr-1" strokeWidth={1.75} /> Action Needed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[rgba(120,120,128,0.12)] text-[rgba(60,60,67,0.85)] dark:text-[rgba(235,235,245,0.85)]">
            <Clock className="w-3 h-3 mr-1" strokeWidth={1.75} /> Staged
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] overflow-hidden">
      
      {/* Table Header */}
      <div className="p-5 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-black dark:text-white text-[17px] tracking-tight">
            Application Pipeline
          </h3>
          <p className="text-[12px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)]">
            Track interview callbacks, automated dispatches, and status updates.
          </p>
        </div>
        <span className="text-[12px] font-semibold bg-[rgba(120,120,128,0.12)] text-black dark:text-white px-2.5 py-1 rounded-[6px]">
          {applications.length} records
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(60,60,67,0.08)] dark:border-[rgba(84,84,88,0.25)] bg-[rgba(120,120,128,0.03)] text-[11px] font-semibold text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] uppercase tracking-wider">
              <th className="py-3 px-6">Company & Role</th>
              <th className="py-3 px-4">Fit Score</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-6 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(60,60,67,0.08)] dark:divide-[rgba(84,84,88,0.25)] text-[13px]">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-[rgba(120,120,128,0.05)] transition-colors">
                <td className="py-3.5 px-6">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-black dark:text-white text-[14px]">
                        {app.company}
                      </div>
                      <div className="text-[12px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)] truncate max-w-xs">
                        {app.job_title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTimelineCompany(app.company)}
                      className="btn-apple-secondary text-[11px] px-2 py-1 gap-1 flex items-center text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/10 cursor-pointer shrink-0"
                      title="View Interview Rounds & AI Prep Briefing"
                    >
                      <Sparkles className="w-3 h-3 text-[#007AFF] dark:text-[#0A84FF]" />
                      <span>Rounds CRM</span>
                    </button>
                  </div>
                </td>
                
                <td className="py-3.5 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-[12px] font-bold ${
                    app.match_score >= 80 
                      ? 'text-[#34C759] dark:text-[#30D158] bg-[#34C759]/15' 
                      : 'text-[#007AFF] dark:text-[#0A84FF] bg-[#007AFF]/15'
                  }`}>
                    {app.match_score}%
                  </span>
                </td>

                <td className="py-3.5 px-4 text-[12px]">
                  {app.recruiter_email ? (
                    <div className="flex items-center text-[#5856D6] dark:text-[#5E5CE6]">
                      <Mail className="w-3.5 h-3.5 mr-1 shrink-0" strokeWidth={1.75} />
                      <span className="truncate max-w-[170px]">{app.recruiter_email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]">
                      <Globe className="w-3.5 h-3.5 mr-1 shrink-0" strokeWidth={1.75} />
                      <span>Web ATS Portal</span>
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  {getStatusBadge(app.status)}
                </td>

                <td className="py-3.5 px-4 text-[12px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]">
                  {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : new Date(app.created_at).toLocaleDateString()}
                </td>

                <td className="py-3.5 px-6 text-right">
                  <select
                    value={app.status}
                    onChange={(e) => onUpdateStatus(app.id, e.target.value)}
                    className="input-apple text-[12px] px-2.5 py-1 font-medium cursor-pointer"
                  >
                    <option value="STAGED">Staged</option>
                    <option value="EMAIL_SENT">Email Sent</option>
                    <option value="FORM_APPLIED">ATS Applied</option>
                    <option value="INTERVIEW">Interviewing 🎉</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 && (
          <div className="text-center py-12 text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)] text-[13px]">
            No application records tracked yet.
          </div>
        )}
      </div>

      {/* Company Interview Rounds Timeline CRM Modal */}
      <CompanyRoundsTimeline
        isOpen={!!timelineCompany}
        onClose={() => setTimelineCompany(null)}
        companyName={timelineCompany || ''}
        onOpenVoiceRecorder={(company) => {
          setTimelineCompany(null);
          onOpenVoiceRecorder?.(company);
        }}
      />
    </div>
  );
};
