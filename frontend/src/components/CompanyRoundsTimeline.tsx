import React, { useState, useEffect } from 'react';
import { X, Clock, User, Mic, Sparkles, ExternalLink, Award } from 'lucide-react';
import { api } from '../services/api';
import { InterviewRound } from '../types';
import { RoundDetailModal } from './RoundDetailModal';

interface CompanyRoundsTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  onOpenVoiceRecorder: (company: string) => void;
}

export const CompanyRoundsTimeline: React.FC<CompanyRoundsTimelineProps> = ({
  isOpen,
  onClose,
  companyName,
  onOpenVoiceRecorder,
}) => {
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  const fetchRounds = async () => {
    if (!companyName) return;
    setLoading(true);
    try {
      const data = await api.getCompanyRounds(companyName);
      setRounds(data);
    } catch (err) {
      console.error('Failed to load company rounds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && companyName) {
      fetchRounds();
    }
  }, [isOpen, companyName]);

  const getRoundTypeColor = (type: string) => {
    switch (type) {
      case 'TECH_CODING':
        return 'bg-apple-indigo/15 text-apple-indigo border-apple-indigo/30';
      case 'SYSTEM_DESIGN':
        return 'bg-apple-orange/15 text-apple-orange border-apple-orange/30';
      case 'BEHAVIORAL':
      case 'CULTURE_ADD':
        return 'bg-apple-purple/15 text-apple-purple border-apple-purple/30';
      case 'HIRING_MANAGER':
      case 'MANAGER':
        return 'bg-apple-teal/15 text-apple-teal border-apple-teal/30';
      case 'EXECUTIVE':
      case 'FINAL_ROUND':
      case 'OFFER':
        return 'bg-apple-green/15 text-apple-green border-apple-green/30';
      default:
        return 'bg-apple-blue/15 text-apple-blue border-apple-blue/30';
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    switch (sentiment) {
      case 'STRONG_YES':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-apple-green/15 text-apple-green">
            Strong Yes
          </span>
        );
      case 'YES':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-apple-teal/15 text-apple-teal">
            Positive
          </span>
        );
      case 'UNSURE':
      case 'CONCERNED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-apple-orange/15 text-apple-orange">
            Needs Work
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-apple-fill-secondary text-apple-secondary">
            {sentiment}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4">
      <div className="material-regular rounded-[20px] shadow-apple-5 border border-apple-border/50 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-apple-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-apple-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-apple-blue/10 flex items-center justify-center text-apple-blue font-bold text-base">
              {companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-apple-label font-bold text-lg tracking-tight">
                {companyName} Interview Journey
              </h3>
              <p className="text-apple-secondary text-xs">
                {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'} logged · AI Notetaker & Prep CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenVoiceRecorder(companyName)}
              className="btn-apple-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" /> + Add Debrief
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-label hover:bg-apple-fill-quaternary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-apple-secondary text-xs">Loading rounds timeline...</p>
            </div>
          ) : rounds.length === 0 ? (
            <div className="py-16 text-center animate-apple-fade-in">
              <div className="w-12 h-12 rounded-full bg-apple-fill-quaternary text-apple-secondary flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-apple-label font-semibold text-sm">No Interview Rounds Yet</h4>
              <p className="text-apple-secondary text-xs max-w-sm mx-auto mt-1 mb-4">
                Record a voice debrief after your call, or forward your recruiter interview invitation email.
              </p>
              <button
                onClick={() => onOpenVoiceRecorder(companyName)}
                className="btn-apple-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4" /> Record First Voice Debrief
              </button>
            </div>
          ) : (
            <div className="relative border-l-2 border-apple-border/70 ml-4 space-y-6">
              {rounds.map((round) => (
                <div key={round.id} className="relative pl-6 group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-apple-card border-2 border-apple-blue shadow-apple-1 flex items-center justify-center text-apple-blue font-bold text-xs">
                    {round.round_number}
                  </div>

                  {/* Round Card */}
                  <div className="p-4 rounded-[14px] bg-apple-card border border-apple-border shadow-apple-1 hover:shadow-apple-2 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border ${getRoundTypeColor(round.round_type)}`}>
                            {round.round_type}
                          </span>
                          {getSentimentBadge(round.candidate_feeling)}
                        </div>
                        <h4 className="text-apple-label font-semibold text-sm">
                          {round.round_title}
                        </h4>
                      </div>

                      <button
                        onClick={() => setSelectedRoundId(round.id)}
                        className="btn-apple-secondary text-xs px-2.5 py-1 flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
                        <span>View Debrief & Prep</span>
                      </button>
                    </div>

                    {/* Metadata chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-apple-secondary">
                      {round.interviewer_info && round.interviewer_info.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{round.interviewer_info.map((i: any) => (typeof i === 'string' ? i : i.name)).join(', ')}</span>
                        </div>
                      )}
                      {round.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{round.duration_minutes} min</span>
                        </div>
                      )}
                      {round.meeting_link && (
                        <a
                          href={round.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-apple-blue hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Meeting Link
                        </a>
                      )}
                    </div>

                    {round.summary && (
                      <p className="mt-2 text-xs text-apple-label/80 line-clamp-2">
                        {round.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drill-down Round Details Modal */}
      <RoundDetailModal
        isOpen={!!selectedRoundId}
        onClose={() => setSelectedRoundId(null)}
        roundId={selectedRoundId}
        companyName={companyName}
      />
    </div>
  );
};
