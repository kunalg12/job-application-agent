import React, { useState } from 'react';
import { X, Plus, Sparkles, ExternalLink, Mail, Building, MapPin } from 'lucide-react';
import { Job } from '../types';

interface ImportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jobData: {
    title: string;
    company: string;
    location?: string;
    description: string;
    url?: string;
    recruiter_email?: string;
  }) => Promise<void>;
}

export const ImportJobModal: React.FC<ImportJobModalProps> = ({ isOpen, onClose, onImport }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote');
  const [url, setUrl] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !description) return;
    setIsSubmitting(true);
    try {
      await onImport({
        title,
        company,
        location,
        url: url || undefined,
        recruiter_email: recruiterEmail || undefined,
        description,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-5 max-w-xl w-full border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
              <Plus className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-black dark:text-white text-[17px] tracking-tight">
              Import Custom Job
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior AI Engineer"
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Anthropic"
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote / San Francisco"
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Recruiter / Contact Email
              </label>
              <input
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="hiring@company.com"
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
              Job URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://company.com/careers/ai-engineer"
              className="input-apple w-full px-3 py-2 text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
              Job Description *
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job posting requirements and details..."
              className="input-apple w-full px-3 py-2 text-[14px] leading-relaxed resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-apple-secondary text-[14px] px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-apple-primary text-[14px] px-5 py-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Importing...' : 'Import & Score'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onStage: (jobId: string) => Promise<void>;
  isStaged: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onStage, isStaged }) => {
  const [isStaging, setIsStaging] = useState(false);

  if (!job) return null;

  const handleStage = async () => {
    setIsStaging(true);
    try {
      await onStage(job.id);
      onClose();
    } finally {
      setIsStaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-5 max-w-2xl w-full border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)] overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]">
                {job.company}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-[rgba(120,120,128,0.12)] font-medium text-[rgba(60,60,67,0.8)] dark:text-[rgba(235,235,245,0.8)]">
                {job.source}
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-black dark:text-white tracking-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mt-2">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#007AFF]" strokeWidth={1.75} /> {job.location}
              </span>
              {job.salary && (
                <span className="font-medium text-[#34C759] dark:text-[#30D158]">
                  {job.salary}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {job.match_score !== undefined && (
            <div className="p-4 rounded-[12px] bg-[rgba(120,120,128,0.06)] dark:bg-[rgba(120,120,128,0.16)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[rgba(60,60,67,0.6)] uppercase tracking-wider block">
                  AI Fit Score
                </span>
                <span className="text-[24px] font-bold text-black dark:text-white">
                  {job.match_score}%
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-[6px] text-[12px] font-semibold ${
                job.match_score >= 80 
                  ? 'bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]' 
                  : job.match_score >= 60 
                  ? 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]' 
                  : 'bg-[#FF9500]/15 text-[#FF9500]'
              }`}>
                {job.match_score >= 80 ? 'High Match' : job.match_score >= 60 ? 'Potential Match' : 'Low Match'}
              </span>
            </div>
          )}

          <div>
            <h4 className="text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] uppercase tracking-wider mb-2">
              Tags & Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-[6px] text-[12px] bg-[rgba(120,120,128,0.12)] text-black dark:text-white font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] uppercase tracking-wider mb-2">
              Job Description
            </h4>
            <div className="text-[14px] leading-relaxed text-black dark:text-white whitespace-pre-wrap font-sans opacity-90">
              {job.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-center justify-between bg-[rgba(120,120,128,0.04)]">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#007AFF] dark:text-[#0A84FF] text-[13px] font-medium flex items-center hover:underline"
            >
              Original Job Link <ExternalLink className="w-3.5 h-3.5 ml-1" strokeWidth={1.75} />
            </a>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn-apple-secondary text-[13px] px-3.5 py-1.5 h-8 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleStage}
              disabled={isStaged || isStaging}
              className={`btn-apple-primary text-[13px] px-4 py-1.5 h-8 gap-1.5 cursor-pointer ${
                isStaged ? 'opacity-50 cursor-not-allowed bg-[#34C759]' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{isStaged ? 'Already Staged' : isStaging ? 'Staging...' : 'Stage in Queue'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
