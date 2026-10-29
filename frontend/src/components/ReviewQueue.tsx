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
      const res: any = await onAutofill(selectedApp.id);
      if (res?.clipboard_payload) {
        try {
          await navigator.clipboard.writeText(res.clipboard_payload);
          setActionSuccess('Autofill executed! Candidate details and cover letter copied to clipboard for quick paste.');
          return;
        } catch (_) {}
      }
      setActionSuccess('Playwright autofill executed! Form filled with your resume details.');
    } catch (err: any) {
      setActionError(err.response?.data?.detail || err.message || 'Autofill error.');
    } finally {
      setIsAutofilling(false);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-[14px] bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mx-auto mb-3">
          <Sparkles className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h3 className="text-[18px] font-semibold text-black dark:text-white mb-1">
          Review Queue is Empty
        </h3>
        <p className="text-[13px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)] max-w-sm mx-auto leading-relaxed">
          Switch to <strong>Job Feed</strong> and click "Stage" on any job to automatically generate tailored outreach emails and cover letters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-3 border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] overflow-hidden flex flex-col md:flex-row h-[780px]">
      
      {/* Left Sidebar: Staged Application List (macOS Style) */}
      <div className="w-full md:w-80 lg:w-96 border-r border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex flex-col bg-[rgba(120,120,128,0.04)] dark:bg-[rgba(120,120,128,0.08)]">
        <div className="p-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-center justify-between">
          <span className="font-semibold text-[13px] text-black dark:text-white">
            Staged Applications ({applications.length})
          </span>
          <span className="text-[11px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]">
            Sorted by fit
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {applications.map((app) => {
            const isSelected = app.id === selectedApp?.id;
            const isSent = app.status === 'EMAIL_SENT' || app.status === 'FORM_APPLIED';

            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`p-3 rounded-[10px] cursor-pointer transition-all duration-150 ${
                  isSelected 
                    ? 'bg-[#007AFF] text-white shadow-apple-1' 
                    : 'hover:bg-[rgba(120,120,128,0.10)] text-black dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider truncate ${
                    isSelected ? 'text-white/80' : 'text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)]'
                  }`}>
                    {app.company}
                  </span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : app.match_score >= 80 
                      ? 'bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]' 
                      : 'bg-[#007AFF]/15 text-[#007AFF]'
                  }`}>
                    {app.match_score}%
                  </span>
                </div>
                <h4 className="text-[14px] font-semibold truncate mb-1">
                  {app.job_title}
                </h4>
                
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center">
                    {app.recruiter_email ? (
                      <span className={`flex items-center ${isSelected ? 'text-white/90' : 'text-[#5856D6] dark:text-[#5E5CE6]'}`}>
                        <Mail className="w-3 h-3 mr-1" strokeWidth={1.75} /> Email Outreach
                      </span>
                    ) : (
                      <span className={`flex items-center ${isSelected ? 'text-white/90' : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]'}`}>
                        <Globe className="w-3 h-3 mr-1" strokeWidth={1.75} /> Web Apply
                      </span>
                    )}
                  </span>
                  {isSent && (
                    <span className={`font-medium flex items-center ${isSelected ? 'text-white' : 'text-[#34C759] dark:text-[#30D158]'}`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" strokeWidth={2} /> Sent
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
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#1C1C1E]">
          
          {/* Header */}
          <div className="p-5 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2.5 mb-1">
                <h2 className="text-[18px] font-bold text-black dark:text-white tracking-tight">
                  {selectedApp.job_title}
                </h2>
                <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold ${
                  selectedApp.match_score >= 80 
                    ? 'bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]' 
                    : 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]'
                }`}>
                  {selectedApp.match_score}% Match
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-[rgba(120,120,128,0.12)] text-[rgba(60,60,67,0.8)] dark:text-[rgba(235,235,245,0.8)] font-medium">
                  {selectedApp.status}
                </span>
              </div>
              <div className="text-[13px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)] flex items-center space-x-3">
                <span className="font-medium text-black dark:text-white">{selectedApp.company}</span>
                {selectedApp.application_url && (
                  <a href={selectedApp.application_url} target="_blank" rel="noreferrer" className="text-[#007AFF] dark:text-[#0A84FF] hover:underline inline-flex items-center text-[12px]">
                    View Job Posting <ExternalLink className="w-3 h-3 ml-1" strokeWidth={1.75} />
                  </a>
                )}
              </div>
            </div>

            {/* Tab Segmented Control & Save Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] p-0.5 rounded-[8px] text-[12px] font-medium">
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-3 py-1 rounded-[6px] transition-all duration-150 ${
                    activeTab === 'email' 
                      ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1' 
                      : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:text-black dark:hover:text-white'
                  }`}
                >
                  Recruiter Email
                </button>
                <button
                  onClick={() => setActiveTab('coverLetter')}
                  className={`px-3 py-1 rounded-[6px] transition-all duration-150 ${
                    activeTab === 'coverLetter' 
                      ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1' 
                      : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:text-black dark:hover:text-white'
                  }`}
                >
                  Cover Letter
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-3 py-1 rounded-[6px] transition-all duration-150 ${
                    activeTab === 'analysis' 
                      ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-apple-1' 
                      : 'text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] hover:text-black dark:hover:text-white'
                  }`}
                >
                  Fit Analysis
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (selectedApp) {
                    await onUpdateApplication(selectedApp.id, {
                      recruiter_email: recipientEmail,
                      email_subject: emailSubject,
                      email_body: emailBody,
                      cover_letter: coverLetterText,
                    });
                    setActionSuccess('Saved draft changes to database.');
                    setTimeout(() => setActionSuccess(null), 3000);
                  }
                }}
                className="btn-apple-secondary text-[12px] px-3 py-1.5 h-7 cursor-pointer"
              >
                Save Draft
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {actionSuccess && (
            <div className="mx-5 mt-3 p-3 rounded-[10px] bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] dark:text-[#30D158] text-[12px] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="mx-5 mt-3 p-3 rounded-[10px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] dark:text-[#FF453A] text-[12px] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>{actionError}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5">
            
            {/* TAB: Recruiter Email */}
            {activeTab === 'email' && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] uppercase tracking-wider mb-1">
                    To: Recruiter / Hiring Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. careers@company.com or talent@company.com"
                    className="input-apple w-full px-3.5 py-2 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="input-apple w-full px-3.5 py-2 text-[14px] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] uppercase tracking-wider mb-1">
                    Email Body
                  </label>
                  <textarea
                    rows={12}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="input-apple w-full px-3.5 py-2.5 text-[14px] font-sans leading-relaxed resize-none"
                  />
                </div>

                {/* Attachments Note */}
                <div className="p-3 bg-[rgba(120,120,128,0.06)] dark:bg-[rgba(120,120,128,0.12)] rounded-[10px] flex items-center justify-between text-[12px]">
                  <div className="flex items-center space-x-2 text-[rgba(60,60,67,0.85)] dark:text-[rgba(235,235,245,0.85)]">
                    <Paperclip className="w-4 h-4 text-[#007AFF]" strokeWidth={1.75} />
                    <span><strong>Attached:</strong> Kunal_Gursal_Resume.pdf + Tailored_Cover_Letter.pdf</span>
                  </div>
                  <span className="text-[#34C759] dark:text-[#30D158] font-medium">Ready</span>
                </div>

                {/* Send Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[12px] text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)]">
                    Direct TLS/SSL SMTP dispatch
                  </span>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending || !recipientEmail}
                    className="btn-apple-primary px-5 py-2 text-[13px] gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>{isSending ? 'Sending...' : 'Send Application Email (1-Click)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Cover Letter */}
            {activeTab === 'coverLetter' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] uppercase tracking-wider">
                    Tailored Formal Cover Letter
                  </label>
                  <a
                    href={`/api/applications/${selectedApp.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-[#007AFF] dark:text-[#0A84FF] font-medium hover:underline inline-flex items-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> Download PDF
                  </a>
                </div>

                <textarea
                  rows={16}
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="input-apple w-full p-4 text-[14px] font-sans leading-relaxed resize-none"
                />

                {/* Autofill Browser Action */}
                <div className="p-4 bg-[#5856D6]/8 dark:bg-[#5856D6]/15 rounded-[12px] border border-[#5856D6]/20 flex items-center justify-between">
                  <div>
                    <h5 className="text-[13px] font-semibold text-[#5856D6] dark:text-[#5E5CE6]">
                      Apply on Company Portal (Playwright ATS Autofill)
                    </h5>
                    <p className="text-[12px] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mt-0.5">
                      Launches visible browser, pre-fills your profile and attaches resume.
                    </p>
                  </div>
                  <button
                    onClick={handleAutofill}
                    disabled={isAutofilling || !selectedApp.application_url}
                    className="btn-apple-secondary text-[#5856D6] dark:text-[#5E5CE6] px-4 py-2 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                    <span>{isAutofilling ? 'Opening...' : 'Launch ATS Autofill'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Fit Analysis */}
            {activeTab === 'analysis' && (
              <div className="space-y-4 max-w-2xl">
                <div className="p-4 rounded-[12px] bg-[rgba(120,120,128,0.06)] dark:bg-[rgba(120,120,128,0.12)]">
                  <h4 className="text-[13px] font-semibold text-black dark:text-white mb-2">
                    Candidate Selling Angle
                  </h4>
                  <p className="text-[13px] text-[rgba(60,60,67,0.8)] dark:text-[rgba(235,235,245,0.8)] leading-relaxed">
                    {selectedApp.notes || "Tailored positioning highlighting GenAI development, React micro-frontends, and high-performance FastAPI backends."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-[12px] bg-[#34C759]/8 dark:bg-[#34C759]/15 border border-[#34C759]/20">
                    <h5 className="text-[12px] font-semibold text-[#34C759] dark:text-[#30D158] uppercase tracking-wider mb-2">
                      Matched Skills
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.matched_skills.map((s, idx) => (
                        <span key={idx} className="text-[12px] px-2 py-0.5 rounded-[6px] bg-white dark:bg-[#1C1C1E] text-black dark:text-white font-medium shadow-apple-1">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-[12px] bg-[#FF9500]/8 dark:bg-[#FF9500]/15 border border-[#FF9500]/20">
                    <h5 className="text-[12px] font-semibold text-[#FF9500] dark:text-[#FF9F0A] uppercase tracking-wider mb-2">
                      Missing / Target Gaps
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.missing_skills.length > 0 ? (
                        selectedApp.missing_skills.map((s, idx) => (
                          <span key={idx} className="text-[12px] px-2 py-0.5 rounded-[6px] bg-white dark:bg-[#1C1C1E] text-black dark:text-white font-medium shadow-apple-1">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-[rgba(60,60,67,0.6)]">No critical gaps identified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
