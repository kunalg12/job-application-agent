import React, { useState } from 'react';
import { Search, Filter, Sparkles, Plus, ExternalLink, Mail, MapPin, Building, CheckCircle2 } from 'lucide-react';
import { Job } from '../types';
import { ImportJobModal, JobDetailModal } from './JobModal';

interface JobFeedProps {
  jobs: Job[];
  onStageJob: (jobId: string) => Promise<void>;
  onImportJob: (jobData: any) => Promise<void>;
  stagedJobIds: Set<string>;
}

export const JobFeed: React.FC<JobFeedProps> = ({
  jobs,
  onStageJob,
  onImportJob,
  stagedJobIds,
}) => {
  const [search, setSearch] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [highMatchOnly, setHighMatchOnly] = useState(false);
  const [withEmailOnly, setWithEmailOnly] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [stagingId, setStagingId] = useState<string | null>(null);

  const filteredJobs = jobs.filter((j) => {
    if (search) {
      const q = search.trim().toLowerCase();
      const text = `${j.title} ${j.company} ${j.tags.join(' ')}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    if (remoteOnly && !j.location.toLowerCase().includes('remote') && !j.description.toLowerCase().includes('worldwide')) {
      return false;
    }
    if (highMatchOnly && (j.match_score || 0) < 80) {
      return false;
    }
    if (withEmailOnly && !j.recruiter_email) {
      return false;
    }
    return true;
  });

  const handleStage = async (jobId: string) => {
    setStagingId(jobId);
    try {
      await onStageJob(jobId);
    } finally {
      setStagingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, or tech stack (e.g. React, Python, GenAI)..."
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              remoteOnly
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Remote Only
          </button>
          
          <button
            onClick={() => setHighMatchOnly(!highMatchOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              highMatchOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            High Match (≥80%)
          </button>

          <button
            onClick={() => setWithEmailOnly(!withEmailOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              withEmailOnly
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Has Recruiter Email
          </button>

          {/* Import Button */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs ml-auto md:ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Job</span>
          </button>
        </div>

      </div>

      {/* Job Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => {
          const isStaged = stagedJobIds.has(job.id);
          const score = job.match_score || 0;
          
          return (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header: Company & Match badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {job.company}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    score >= 60 ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {score}% Match
                  </span>
                </div>

                {/* Job Title */}
                <h3
                  onClick={() => setSelectedJob(job)}
                  className="font-semibold text-slate-900 text-base mb-2 hover:text-sky-600 cursor-pointer line-clamp-2"
                >
                  {job.title}
                </h3>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-400" /> {job.location}</span>
                  {job.salary && <span className="font-medium text-emerald-600">{job.salary}</span>}
                  {job.recruiter_email && (
                    <span className="flex items-center text-sky-600" title={job.recruiter_email}>
                      <Mail className="w-3 h-3 mr-1" /> Hiring Email
                    </span>
                  )}
                </div>

                {/* Tags / Matched Skills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(job.matched_skills && job.matched_skills.length > 0
                    ? job.matched_skills
                    : job.tags
                  ).slice(0, 4).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Details
                </button>

                {isStaged ? (
                  <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Staged
                  </span>
                ) : (
                  <button
                    onClick={() => handleStage(job.id)}
                    disabled={stagingId === job.id}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 active:scale-95 transition-all shadow-xs disabled:opacity-60"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{stagingId === job.id ? 'Tailoring...' : 'Stage for Apply'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm mb-2">No jobs match your current filters.</p>
          <button
            onClick={() => { setSearch(''); setRemoteOnly(false); setHighMatchOnly(false); setWithEmailOnly(false); }}
            className="text-xs text-sky-600 font-medium hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Modals */}
      <ImportJobModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={onImportJob}
      />

      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStage={onStageJob}
      />
    </div>
  );
};
