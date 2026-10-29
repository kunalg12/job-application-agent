import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, AlertCircle, FileText, CheckCircle2, X, Sparkles, Building2 } from 'lucide-react';
import { AudioRecorder } from '../services/audioRecorder';
import { api } from '../services/api';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoundSaved?: (roundId: string) => void;
  defaultCompany?: string;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onRoundSaved,
  defaultCompany = '',
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([12, 18, 24, 16, 28, 20, 32, 14, 22, 10, 15, 25, 30, 18, 12, 8]);
  const [scratchpadText, setScratchpadText] = useState('');
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    roundId: string;
    company: string;
    title: string;
    questionsCount: number;
  } | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (defaultCompany) {
      setCompanyName(defaultCompany);
    }
  }, [defaultCompany]);

  useEffect(() => {
    return () => {
      stopRecording();
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setSuccessResult(null);
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start waveform animation loop
      const updateWaveform = () => {
        if (recorderRef.current) {
          const freqs = recorderRef.current.getFrequencyData();
          setWaveformBars(freqs.map((v) => Math.max(8, Math.min(60, Math.floor(v / 3)))));
        }
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access microphone';
      setErrorMessage(`${msg}. You can use the Text Scratchpad tab instead.`);
      setActiveTab('text');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsRecording(false);

    if (recorderRef.current) {
      try {
        setIsProcessing(true);
        const audioBlob = await recorderRef.current.stop();
        const formData = new FormData();
        formData.append('file', audioBlob, 'interview_voice_note.webm');
        formData.append('user_id', 'default-user');
        if (companyName) {
          formData.append('company_name', companyName);
        }

        const res = await api.uploadVoiceRecording(formData);
        setIsProcessing(false);
        setSuccessResult({
          roundId: res.round_id,
          company: res.round.company_id,
          title: res.round.round_title,
          questionsCount: res.parsed_context.questions_extracted?.length || 0,
        });
        if (onRoundSaved) {
          onRoundSaved(res.round_id);
        }
      } catch (err: unknown) {
        setIsProcessing(false);
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setErrorMessage(msg);
      }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchpadText.trim()) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const res = await api.ingestText({
        raw_text: scratchpadText,
        user_id: 'default-user',
        company_name: companyName || undefined,
      });
      setIsProcessing(false);
      setSuccessResult({
        roundId: res.round_id,
        company: res.round.company_id,
        title: res.round.round_title,
        questionsCount: res.parsed_context.questions_extracted?.length || 0,
      });
      if (onRoundSaved) {
        onRoundSaved(res.round_id);
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Text ingestion failed';
      setErrorMessage(msg);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="material-regular rounded-[20px] shadow-apple-5 border border-apple-border/50 max-w-lg w-full overflow-hidden p-6 animate-apple-fade-in relative">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-apple-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-apple-red/10 flex items-center justify-center text-apple-red">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-apple-label font-semibold text-base leading-tight">AI Interview Notetaker</h3>
              <p className="text-apple-secondary text-xs">Record debrief or paste recruiter invitation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-apple-secondary hover:text-apple-label hover:bg-apple-fill-quaternary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Company Name Input */}
        <div className="mt-4 mb-3">
          <label className="block text-apple-secondary text-xs font-medium mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Target Company (Optional, AI auto-detects)
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Stripe, Datadog, Linear..."
            className="w-full px-3 py-1.5 text-sm rounded-[10px] bg-apple-bg-grouped border border-apple-border text-apple-label focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
          />
        </div>

        {/* Segmented Control Tabs */}
        <div className="segmented-control p-0.5 rounded-[10px] flex mb-5 bg-apple-fill-quaternary">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-apple-card text-apple-label shadow-apple-1'
                : 'text-apple-secondary hover:text-apple-label'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Voice Memo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'text'
                ? 'bg-apple-card text-apple-label shadow-apple-1'
                : 'text-apple-secondary hover:text-apple-label'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Text Scratchpad
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-[12px] bg-apple-red/10 border border-apple-red/20 text-apple-red text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback Card */}
        {successResult ? (
          <div className="p-4 rounded-[14px] bg-apple-green/10 border border-apple-green/30 text-center animate-apple-fade-in">
            <div className="w-10 h-10 rounded-full bg-apple-green/20 text-apple-green flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-apple-label font-semibold text-sm">Round Structured Successfully</h4>
            <p className="text-apple-secondary text-xs mt-1">
              {successResult.company} · {successResult.title}
            </p>
            {successResult.questionsCount > 0 && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue text-[11px] font-medium">
                {successResult.questionsCount} questions saved to interview repository
              </span>
            )}
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={() => {
                  setSuccessResult(null);
                  setScratchpadText('');
                  onClose();
                }}
                className="btn-apple-primary px-4 py-1.5 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : isProcessing ? (
          /* Processing State */
          <div className="py-12 text-center animate-apple-fade-in">
            <div className="w-10 h-10 rounded-full border-2 border-apple-blue border-t-transparent animate-spin mx-auto mb-3" />
            <h4 className="text-apple-label font-medium text-sm flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-apple-blue animate-pulse" />
              AI Synthesizing Interview Context...
            </h4>
            <p className="text-apple-secondary text-xs mt-1">
              Transcribing audio, detecting interviewer questions, and extracting feedback
            </p>
          </div>
        ) : activeTab === 'voice' ? (
          /* Voice Memo Tab */
          <div className="flex flex-col items-center py-6">
            {/* Live Waveform Visualizer */}
            <div className="w-full h-20 bg-apple-bg-grouped rounded-[14px] border border-apple-border flex items-center justify-center gap-1.5 px-4 mb-4 overflow-hidden">
              {waveformBars.map((height, i) => (
                <div
                  key={i}
                  style={{ height: `${height}px` }}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isRecording ? 'bg-apple-red shadow-[0_0_8px_rgba(255,59,48,0.5)]' : 'bg-apple-fill-secondary'
                  }`}
                />
              ))}
            </div>

            {/* Timer Display */}
            <div className="text-2xl font-mono font-medium text-apple-label tracking-tight mb-5">
              {formatTime(recordingSeconds)}
            </div>

            {/* Tactile Record / Stop Button */}
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-apple-card border-2 border-apple-red p-1 shadow-apple-3 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-apple-red group-hover:opacity-90 transition-opacity flex items-center justify-center text-white">
                    <Mic className="w-6 h-6" />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-apple-card border-2 border-apple-red p-1 shadow-apple-3 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                >
                  <div className="w-7 h-7 rounded-[8px] bg-apple-red flex items-center justify-center text-white">
                    <Square className="w-4 h-4 fill-white" />
                  </div>
                </button>
              )}
            </div>

            <p className="text-apple-secondary text-xs mt-4">
              {isRecording ? 'Recording voice debrief... Click square to finish' : 'Tap red button to record voice debrief'}
            </p>
          </div>
        ) : (
          /* Text Scratchpad Tab */
          <form onSubmit={handleTextSubmit}>
            <textarea
              rows={6}
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="Paste email invitation or type post-interview notes:
e.g. 'Just had round 2 at Stripe with David. We designed a distributed ledger in FastAPI and discussed cache invalidation. Overall went great, felt confident on DB schema.'"
              className="w-full p-3 text-xs rounded-[12px] bg-apple-bg-grouped border border-apple-border text-apple-label focus:outline-none focus:ring-2 focus:ring-apple-blue/50 resize-none font-sans"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-apple-secondary px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!scratchpadText.trim()}
                className="btn-apple-primary px-4 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Parse Notes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
