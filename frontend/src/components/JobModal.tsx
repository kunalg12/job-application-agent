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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-slate-900 text-lg">Import Custom Job Posting</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Full Stack Developer"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme AI"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote / Worldwide"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Recruiter / HR Email (Optional)</label>
              <input
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="careers@company.com"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Job Post URL (LinkedIn, Lever, etc.)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Job Description / Requirements *</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the job requirements, responsibilities, and qualifications..."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Importing & Scoring...' : 'Import & Compute Match'}
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
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onStage }) => {
  const [isStaging, setIsStaging] = useState(false);

  if (!job) return null;

  const handleStage = async () => {
    setIsStaging(true);
    try {
      await onStage(job.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsStaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-semibold text-slate-900 text-xl">{job.title}</h3>
              {job.match_score !== undefined && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  job.match_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                  job.match_score >= 60 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {job.match_score}% Match
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center"><Building className="w-3.5 h-3.5 mr-1 text-slate-400" /> {job.company}</span>
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {job.location}</span>
              {job.recruiter_email && (
                <span className="flex items-center text-sky-600"><Mail className="w-3.5 h-3.5 mr-1" /> {job.recruiter_email}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {job.matched_skills && job.matched_skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Matched Skills from Your Resume</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.matched_skills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Job Description</h4>
            <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
              {job.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-600 hover:underline flex items-center"
            >
              View original job post <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          ) : <div />}

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
            <button
              onClick={handleStage}
              disabled={isStaging}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-60 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isStaging ? 'Generating Tailored Outreach...' : 'Stage for Application'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
