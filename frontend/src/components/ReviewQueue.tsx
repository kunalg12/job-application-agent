import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, AlertCircle, Sparkles, ExternalLink, Globe, Mail, Paperclip, Download } from 'lucide-react';
import { Application } from '../types';

interface ReviewQueueProps {
  applications: Application[];
  onSendEmail: (appId: string, payload: { to_email?: string; subject?: string; body?: string }) => Promise<void>;
  onAutofill: (appId: string) => Promise<void>;
  onUpdateApplication: (appId: string, payload: Partial<Application>) => Promise<void>;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  applications,
  onSendEmail,
  onAutofill,
  onUpdateApplication,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    applications.length > 0 ? applications[0].id : null
  );
  const [activeTab, setActiveTab] = useState<'email' | 'coverLetter' | 'analysis'>('email');

  // Active application state
  const selectedApp = applications.find((a) => a.id === selectedAppId) || applications[0] || null;

  // Local draft state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync draft whenever selected application changes
  React.useEffect(() => {
    if (selectedApp) {
      setRecipientEmail(selectedApp.recruiter_email || '');
      setEmailSubject(selectedApp.email_subject || `Application: ${selectedApp.job_title} - Kunal Gursal`);
      setEmailBody(selectedApp.email_body || '');
      setCoverLetterText(selectedApp.cover_letter || '');
      setActionSuccess(null);
      setActionError(null);
    }
  }, [selectedApp?.id]);

  const handleSendEmail = async () => {
    if (!selectedApp) return;
    setIsSending(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await onSendEmail(selectedApp.id, {
        to_email: recipientEmail,
        subject: emailSubject,
        body: emailBody,
      });
      setActionSuccess(`Application email successfully dispatched to ${recipientEmail}!`);
    } catch (err: any) {
      setActionError(err.response?.data?.detail || err.message || 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAutofill = async () => {
    if (!selectedApp) return;
    setIsAutofilling(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await onAutofill(selectedApp.id);
      setActionSuccess('Playwright autofill executed! Form filled with your resume details.');
    } catch (err: any) {
      setActionError(err.response?.data?.detail || err.message || 'Autofill error.');
    } finally {
      setIsAutofilling(false);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8">
        <Sparkles className="w-12 h-12 text-sky-500 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Your Review Queue is Empty</h3>
        <p className="text-sm text-slate-500 mb-6">
          Head over to the <strong>Job Feed</strong> tab and click "Stage for Apply" on any job to automatically generate tailored outreach emails and cover letters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[780px]">
      
      {/* Left Sidebar: Staged Application List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-sm text-slate-900">Staged Applications ({applications.length})</span>
          <span className="text-xs text-slate-500">Sorted by fit</span>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {applications.map((app) => {
            const isSelected = app.id === selectedApp?.id;
            const isSent = app.status === 'EMAIL_SENT' || app.status === 'FORM_APPLIED';

            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-sky-50/80 border-l-4 border-sky-600' : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {app.company}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    app.match_score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                  }`}>
                    {app.match_score}%
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 truncate mb-1.5">
                  {app.job_title}
                </h4>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center">
                    {app.recruiter_email ? (
                      <span className="text-indigo-600 flex items-center"><Mail className="w-3 h-3 mr-1" /> Email Outreach</span>
                    ) : (
                      <span className="text-slate-600 flex items-center"><Globe className="w-3 h-3 mr-1" /> Web / ATS Apply</span>
                    )}
                  </span>
                  {isSent && (
                    <span className="text-emerald-600 font-medium flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedApp && (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{selectedApp.job_title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedApp.match_score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                }`}>
                  {selectedApp.match_score}% Match
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  {selectedApp.status}
                </span>
              </div>
              <div className="text-sm text-slate-500 flex items-center space-x-3">
                <span className="font-medium text-slate-700">{selectedApp.company}</span>
                {selectedApp.application_url && (
                  <a href={selectedApp.application_url} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline inline-flex items-center text-xs">
                    View Job Posting <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
            </div>

            {/* Tab Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('email')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'email' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recruiter Email
              </button>
              <button
                onClick={() => setActiveTab('coverLetter')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'coverLetter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cover Letter
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fit Analysis
              </button>
            </div>
          </div>

          {/* Alert feedback */}
          {actionSuccess && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* TAB: Recruiter Email */}
            {activeTab === 'email' && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    To: Recruiter / Hiring Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. careers@company.com or talent@company.com"
                    className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Body
                  </label>
                  <textarea
                    rows={12}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans leading-relaxed text-slate-700"
                  />
                </div>

                {/* Attachments Note */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span><strong>Attached:</strong> Kunal_Gursal_Resume.pdf + Tailored_Cover_Letter.pdf</span>
                  </div>
                  <span className="text-emerald-700 font-medium">Ready for Delivery</span>
                </div>

                {/* Send Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">SMTP direct dispatch via configured gateway</span>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending || !recipientEmail}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 active:scale-95 transition-all shadow-sm disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'Sending Application...' : 'Send Application Email (1-Click)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Cover Letter */}
            {activeTab === 'coverLetter' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Tailored Formal Cover Letter
                  </label>
                  <a
                    href={`/api/applications/${selectedApp.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-600 font-medium hover:underline inline-flex items-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
                  </a>
                </div>

                <textarea
                  rows={16}
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="w-full text-sm p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans leading-relaxed text-slate-700"
                />

                {/* Autofill Browser Action */}
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-indigo-900">Apply on Company Portal (Playwright ATS Autofill)</h5>
                    <p className="text-xs text-indigo-700 mt-0.5">Launches visible browser, pre-fills your profile and attaches resume.</p>
                  </div>
                  <button
                    onClick={handleAutofill}
                    disabled={isAutofilling || !selectedApp.application_url}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isAutofilling ? 'Autofilling...' : 'Auto-Fill in Browser'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Fit Analysis */}
            {activeTab === 'analysis' && (
              <div className="space-y-6 max-w-3xl">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resume Fit Score</h4>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-extrabold text-slate-900">{selectedApp.match_score}%</span>
                    <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Strong Fit for AI Full Stack
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Matched Competencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.matched_skills.map((s) => (
                      <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedApp.missing_skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Potential Skill Gaps in Posting</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.missing_skills.map((s) => (
                        <span key={s} className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium">
                          ! {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
