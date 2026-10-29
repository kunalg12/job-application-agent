import React from 'react';
import { Mail, Globe, CheckCircle2, Clock, AlertCircle, XCircle, Award, Archive, ExternalLink } from 'lucide-react';
import { Application } from '../types';

interface ApplicationsTrackerProps {
  applications: Application[];
  onUpdateStatus: (appId: string, status: string) => Promise<void>;
}

export const ApplicationsTracker: React.FC<ApplicationsTrackerProps> = ({
  applications,
  onUpdateStatus,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EMAIL_SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Email Sent
          </span>
        );
      case 'FORM_APPLIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Globe className="w-3 h-3 mr-1 text-sky-500" /> ATS Applied
          </span>
        );
      case 'INTERVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Award className="w-3 h-3 mr-1 text-purple-500" /> Interviewing
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1 text-rose-500" /> Rejected
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-500" /> Action Required
          </span>
        );
      case 'UNROUTABLE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-500" /> Unroutable (Add Link/Email)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 mr-1 text-slate-400" /> Staged
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">Application History & Pipeline</h3>
          <p className="text-xs text-slate-500">Track responses, interviews, and outreach records.</p>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
          {applications.length} total records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-6">Company & Title</th>
              <th className="py-3 px-4">Fit Score</th>
              <th className="py-3 px-4">Channel / Recipient</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date Staged / Applied</th>
              <th className="py-3 px-6 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-semibold text-slate-900">{app.company}</div>
                  <div className="text-xs text-slate-500 truncate max-w-xs">{app.job_title}</div>
                </td>
                
                <td className="py-4 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${
                    app.match_score >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-sky-700 bg-sky-50'
                  }`}>
                    {app.match_score}%
                  </span>
                </td>

                <td className="py-4 px-4 text-xs">
                  {app.recruiter_email ? (
                    <div className="flex items-center text-indigo-600">
                      <Mail className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span className="truncate max-w-[180px]">{app.recruiter_email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-slate-500">
                      <Globe className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span>Web ATS Portal</span>
                    </div>
                  )}
                </td>

                <td className="py-4 px-4">
                  {getStatusBadge(app.status)}
                </td>

                <td className="py-4 px-4 text-xs text-slate-500">
                  {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : new Date(app.created_at).toLocaleDateString()}
                </td>

                <td className="py-4 px-6 text-right">
                  <select
                    value={app.status}
                    onChange={(e) => onUpdateStatus(app.id, e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium"
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
          <div className="text-center py-12 text-slate-400 text-sm">
            No application records found.
          </div>
        )}
      </div>
    </div>
  );
};
