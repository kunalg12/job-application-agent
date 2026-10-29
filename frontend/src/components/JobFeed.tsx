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
      {/* Control Bar (Apple Floating Bar) */}
      <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-[16px] shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        
        {/* Spotlight-Style Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)] absolute left-3 top-2.5" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, or skills (Python, FastAPI, React, GenAI)..."
            className="input-apple w-full pl-9 pr-4 py-1.5 text-[14px]"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer ${
              remoteOnly
                ? 'bg-[#007AFF] text-white shadow-apple-1'
                : 'bg-[rgba(120,120,128,0.10)] hover:bg-[rgba(120,120,128,0.18)] text-black dark:text-white'
            }`}
          >
            Remote
          </button>
          <button
            onClick={() => setHighMatchOnly(!highMatchOnly)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer ${
              highMatchOnly
                ? 'bg-[#34C759] text-white shadow-apple-1'
                : 'bg-[rgba(120,120,128,0.10)] hover:bg-[rgba(120,120,128,0.18)] text-black dark:text-white'
            }`}
          >
            High Match (&ge;80%)
          </button>
          <button
            onClick={() => setWithEmailOnly(!withEmailOnly)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer ${
              withEmailOnly
                ? 'bg-[#5856D6] text-white shadow-apple-1'
                : 'bg-[rgba(120,120,128,0.10)] hover:bg-[rgba(120,120,128,0.18)] text-black dark:text-white'
            }`}
          >
            Recruiter Email
          </button>

          <div className="h-5 w-[1px] bg-[rgba(60,60,67,0.15)] dark:bg-[rgba(84,84,88,0.4)] mx-1 hidden sm:block"></div>

          <button
            onClick={() => setImportModalOpen(true)}
            className="btn-apple-primary text-[13px] px-3 py-1.5 h-8 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Import Job</span>
          </button>
        </div>
      </div>

      {/* Feed Stats Sub-header */}
      <div className="flex items-center justify-between px-1 text-[13px] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]">
        <span>Showing <strong className="text-black dark:text-white">{filteredJobs.length}</strong> available openings</span>
        <span className="text-[12px]">Click any card to inspect full description & candidate angles</span>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] p-12 text-center shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)]">
          <Building className="w-10 h-10 mx-auto text-[#8E8E93] mb-3" strokeWidth={1.5} />
          <h3 className="text-[17px] font-semibold text-black dark:text-white">No job openings found</h3>
          <p className="text-[13px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] mt-1 max-w-sm mx-auto">
            Try resetting your search query or filters, or import a custom job posting directly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredJobs.map((job) => {
            const isStaged = stagedJobIds.has(job.id);
            const score = job.match_score ?? 75;
            
            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white dark:bg-[#1C1C1E] rounded-[16px] p-5 shadow-apple-2 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.08)] hover:shadow-apple-3 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Company and Fit Score */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]">
                          {job.company}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-[4px] bg-[rgba(120,120,128,0.12)] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]">
                          {job.source}
                        </span>
                      </div>
                      <h3 className="text-[16px] font-semibold text-black dark:text-white mt-1 line-clamp-1 group-hover:text-[#007AFF] transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    {/* Apple Style Fit Score Badge */}
                    <div className={`px-2 py-0.5 rounded-[6px] text-[12px] font-bold shrink-0 ${
                      score >= 80
                        ? 'bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]'
                        : score >= 60
                        ? 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF]'
                        : 'bg-[#FF9500]/15 text-[#FF9500]'
                    }`}>
                      {score}%
                    </div>
                  </div>

                  {/* Location & Metadata */}
                  <div className="flex items-center text-[12px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)] space-x-3 mb-3">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-[#007AFF]" strokeWidth={1.75} />
                      {job.location}
                    </span>
                    {job.recruiter_email && (
                      <span className="flex items-center text-[#5856D6] dark:text-[#5E5CE6]">
                        <Mail className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> Recruiter Email
                      </span>
                    )}
                  </div>

                  {/* Snippet */}
                  <p className="text-[13px] text-[rgba(60,60,67,0.75)] dark:text-[rgba(235,235,245,0.75)] line-clamp-2 leading-relaxed mb-4">
                    {job.description}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[rgba(60,60,67,0.08)] dark:border-[rgba(84,84,88,0.3)] flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {job.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(120,120,128,0.10)] text-[rgba(60,60,67,0.85)] dark:text-[rgba(235,235,245,0.85)] font-medium">
                        {tag}
                      </span>
                    ))}
                    {job.tags.length > 2 && (
                      <span className="text-[11px] text-[rgba(60,60,67,0.5)] dark:text-[rgba(235,235,245,0.5)] self-center">
                        +{job.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStage(job.id);
                    }}
                    disabled={isStaged || stagingId === job.id}
                    className={`btn-apple-primary text-[12px] px-3 py-1 h-7.5 gap-1 cursor-pointer ${
                      isStaged
                        ? 'bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158] cursor-default'
                        : ''
                    }`}
                  >
                    {isStaged ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Staged</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{stagingId === job.id ? 'Staging...' : 'Stage'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
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
        isStaged={selectedJob ? stagedJobIds.has(selectedJob.id) : false}
      />
    </div>
  );
};
