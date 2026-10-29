import React, { useState, useEffect } from 'react';
import { X, Sparkles, Mail, Check, Copy, HelpCircle, AlertTriangle, Calendar, Clock, User, Headphones } from 'lucide-react';
import { api } from '../services/api';
import { InterviewRound, InterviewQuestion, RoundPrepBriefing } from '../types';

interface RoundDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: string | null;
  companyName: string;
}

export const RoundDetailModal: React.FC<RoundDetailModalProps> = ({
  isOpen,
  onClose,
  roundId,
  companyName,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'prep' | 'thankyou'>('details');
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState<InterviewRound | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [prepBriefing, setPrepBriefing] = useState<RoundPrepBriefing | null>(null);
  const [thankYouNote, setThankYouNote] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !roundId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const detail = await api.getRoundDetail(roundId);
        setRound(detail.round);
        setQuestions(detail.questions || []);

        // Load prep briefing
        const prep = await api.getRoundPrepBriefing(roundId);
        setPrepBriefing(prep);

        // Load thank you note draft
        const note = await api.generateThankYouNote(roundId);
        setThankYouNote(note);
      } catch (err) {
        console.error('Failed to load round details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, roundId]);

  const handleCopyThankYou = () => {
    if (!thankYouNote) return;
    navigator.clipboard.writeText(`Subject: ${thankYouNote.subject}\n\n${thankYouNote.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !roundId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4">
      <div className="material-regular rounded-[20px] shadow-apple-5 border border-apple-border/50 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-apple-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-apple-border/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-apple-blue/12 text-apple-blue">
                {round?.round_type || 'Interview'}
              </span>
              <span className="text-apple-secondary text-xs">
                Round {round?.round_number || 1} · {companyName}
              </span>
            </div>
            <h3 className="text-apple-label font-bold text-lg mt-1 tracking-tight">
              {round?.round_title || 'Interview Round'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-label hover:bg-apple-fill-quaternary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Segmented Control */}
        <div className="px-5 pt-3">
          <div className="segmented-control p-0.5 rounded-[10px] flex bg-apple-fill-quaternary">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'details'
                  ? 'bg-apple-card text-apple-label shadow-apple-1'
                  : 'text-apple-secondary hover:text-apple-label'
              }`}
            >
              Debrief & Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('prep')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'prep'
                  ? 'bg-apple-card text-apple-label shadow-apple-1'
                  : 'text-apple-secondary hover:text-apple-label'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-apple-blue" /> AI Prep Briefing
            </button>
            <button
              onClick={() => setActiveTab('thankyou')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'thankyou'
                  ? 'bg-apple-card text-apple-label shadow-apple-1'
                  : 'text-apple-secondary hover:text-apple-label'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-apple-green" /> Thank You Note
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-apple-secondary text-xs">Loading round intelligence...</p>
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Interviewer & Summary Metadata Card */}
              <div className="p-3.5 rounded-[14px] bg-apple-fill-quaternary border border-apple-border/50">
                <div className="flex flex-wrap items-center gap-3 text-xs text-apple-secondary mb-2">
                  {round?.interviewer_info && round.interviewer_info.length > 0 && (
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{round.interviewer_info.map((i: any) => (typeof i === 'string' ? i : i.name)).join(', ')}</span>
                    </div>
                  )}
                  {round?.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{round.duration_minutes} min duration</span>
                    </div>
                  )}
                  {round?.candidate_feeling && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-apple-green/15 text-apple-green">
                      Sentiment: {round.candidate_feeling}
                    </span>
                  )}
                </div>

                {round?.summary && (
                  <p className="text-apple-label text-xs leading-relaxed mt-2">
                    {round.summary}
                  </p>
                )}

                {/* Audio URL Player if available */}
                {round?.audio_url && (
                  <div className="mt-3 pt-3 border-t border-apple-border/40 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-apple-blue" />
                    <span className="text-xs text-apple-secondary font-medium">Recorded Voice Memo</span>
                    <audio controls src={round.audio_url} className="h-7 ml-auto max-w-[200px]" />
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div>
                <h4 className="text-apple-label font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-apple-blue" />
                  Questions Asked in this Round
                </h4>
                {questions.length === 0 ? (
                  <p className="text-apple-secondary text-xs italic">
                    No specific questions parsed. Record a voice debrief to extract interview questions automatically.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q) => (
                      <div key={q.id} className="p-3 rounded-[12px] bg-apple-card border border-apple-border shadow-apple-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-apple-label text-xs font-medium leading-snug">
                            {q.question_text}
                          </p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-apple-fill-secondary text-apple-secondary shrink-0">
                            {q.question_category}
                          </span>
                        </div>
                        {q.areas_to_improve && (
                          <div className="mt-2 text-[11px] text-apple-orange flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Reflection: {q.areas_to_improve}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'prep' ? (
            /* AI Prep Briefing View */
            <div className="space-y-4">
              <div className="p-3.5 rounded-[14px] bg-gradient-to-br from-apple-blue/10 to-transparent border border-apple-blue/20">
                <h4 className="text-apple-label font-semibold text-xs flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-apple-blue" />
                  Round Intelligence Overview
                </h4>
                <p className="text-apple-secondary text-xs leading-relaxed">
                  {prepBriefing?.overview}
                </p>
              </div>

              {/* Key Topics to Review */}
              <div>
                <h5 className="text-apple-label font-semibold text-xs uppercase tracking-wider mb-2">
                  High-Priority Topics to Review
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {prepBriefing?.key_topics_to_review.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-[8px] bg-apple-blue/10 text-apple-blue text-xs font-medium">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Predicted Questions */}
              <div>
                <h5 className="text-apple-label font-semibold text-xs uppercase tracking-wider mb-2">
                  Anticipated Questions to Rehearse
                </h5>
                <div className="space-y-2">
                  {prepBriefing?.predicted_questions.map((pq, i) => (
                    <div key={i} className="p-2.5 rounded-[10px] bg-apple-card border border-apple-border text-xs text-apple-label flex items-start gap-2 shadow-apple-1">
                      <span className="w-5 h-5 rounded-full bg-apple-blue/12 text-apple-blue flex items-center justify-center font-bold text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <span>{pq}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips Based on History */}
              {prepBriefing?.tips_based_on_history && prepBriefing.tips_based_on_history.length > 0 && (
                <div>
                  <h5 className="text-apple-label font-semibold text-xs uppercase tracking-wider mb-2">
                    Actionable Tips from Previous Rounds
                  </h5>
                  <div className="space-y-1.5">
                    {prepBriefing.tips_based_on_history.map((tip, i) => (
                      <div key={i} className="p-2 rounded-[8px] bg-apple-orange/10 border border-apple-orange/20 text-xs text-apple-orange flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Thank You Note Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-apple-secondary text-xs">Tailored Post-Interview Follow-Up</span>
                <button
                  onClick={handleCopyThankYou}
                  className="btn-apple-secondary text-xs px-2.5 py-1 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-apple-green" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Email Draft
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-[12px] bg-apple-bg-grouped border border-apple-border space-y-2">
                <div className="text-xs">
                  <span className="text-apple-secondary font-medium">Subject: </span>
                  <span className="text-apple-label font-semibold">{thankYouNote?.subject}</span>
                </div>
                <div className="border-t border-apple-border/50 pt-2 text-xs text-apple-label whitespace-pre-line leading-relaxed font-sans">
                  {thankYouNote?.body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-apple-border/40 flex justify-end">
          <button onClick={onClose} className="btn-apple-primary px-4 py-1.5 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
