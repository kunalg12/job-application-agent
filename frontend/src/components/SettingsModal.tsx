import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Shield, Zap, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onSave: (settings: AppSettings) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings | null>(settings);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setFormData(settings);
    if (settings?.smtp?.username) {
      setTestEmailRecipient(settings.smtp.username);
    }
  }, [settings]);

  if (!isOpen || !formData) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient) return;
    setTestingEmail(true);
    setTestResult(null);
    try {
      await onSave(formData);
      const res = await api.testEmail(testEmailRecipient);
      setTestResult({ success: true, message: res.message });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'SMTP test failed.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-5 max-w-2xl w-full border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
              <SettingsIcon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-black dark:text-white text-[17px] tracking-tight">
              Agent Settings & SMTP Gateway
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
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1 text-[13px]">
          
          {/* Section: Autonomous Mode & Guardrails */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]">
              Automation Mode & Safeguards
            </h4>

            {/* Mode Selector (Apple HIG Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setFormData({ ...formData, autonomous_mode: false })}
                className={`p-4 rounded-[14px] border cursor-pointer transition-all ${
                  !formData.autonomous_mode
                    ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#0A84FF]/10 shadow-apple-1'
                    : 'border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] hover:bg-[rgba(120,120,128,0.05)]'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-[#007AFF]" strokeWidth={1.75} />
                  <span className="font-semibold text-black dark:text-white text-[14px]">
                    Supervised 1-Click
                  </span>
                </div>
                <p className="text-[12px] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] leading-relaxed">
                  Aggregates and stages tailored letters in queue, requiring your 1-click confirmation before dispatch.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, autonomous_mode: true })}
                className={`p-4 rounded-[14px] border cursor-pointer transition-all ${
                  formData.autonomous_mode
                    ? 'border-[#FF9500] bg-[#FF9500]/5 dark:bg-[#FF9F0A]/10 shadow-apple-1'
                    : 'border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] hover:bg-[rgba(120,120,128,0.05)]'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-4 h-4 text-[#FF9500]" strokeWidth={1.75} />
                  <span className="font-semibold text-black dark:text-white text-[14px]">
                    Autonomous Auto-Pilot
                  </span>
                </div>
                <p className="text-[12px] text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] leading-relaxed">
                  Automatically dispatches emails and submits forms for jobs matching your score threshold.
                </p>
              </div>
            </div>

            {/* Threshold & Rate limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                  Auto-Apply Score Threshold: <strong className="text-black dark:text-white">{formData.auto_apply_threshold}%</strong>
                </label>
                <input
                  type="range"
                  min={60}
                  max={95}
                  step={5}
                  value={formData.auto_apply_threshold}
                  onChange={(e) => setFormData({ ...formData, auto_apply_threshold: Number(e.target.value) })}
                  className="w-full accent-[#007AFF] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                  Daily Application Cap (Spam Protection)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.daily_application_limit}
                  onChange={(e) => setFormData({ ...formData, daily_application_limit: Number(e.target.value) })}
                  className="input-apple w-full px-3 py-1.5 text-[14px]"
                />
              </div>
            </div>
          </div>

          <hr className="border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)]" />

          {/* Section: SMTP Email Configuration */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]">
              SMTP Recruiter Email Gateway
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={formData.smtp.host}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, host: e.target.value } })}
                  placeholder="smtp.gmail.com"
                  className="input-apple w-full px-3 py-2 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.smtp.port}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, port: Number(e.target.value) } })}
                  placeholder="587"
                  className="input-apple w-full px-3 py-2 text-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                  Email / Username
                </label>
                <input
                  type="email"
                  value={formData.smtp.username}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, username: e.target.value } })}
                  placeholder="your-email@gmail.com"
                  className="input-apple w-full px-3 py-2 text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                  App Password
                </label>
                <input
                  type="password"
                  value={formData.smtp.password || ''}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, password: e.target.value } })}
                  placeholder="••••••••••••••••"
                  className="input-apple w-full px-3 py-2 text-[14px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Sender Name (From Header)
              </label>
              <input
                type="text"
                value={formData.smtp.from_name}
                onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, from_name: e.target.value } })}
                placeholder="Kunal Gursal"
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>

            {/* Test Email Box */}
            <div className="p-3 bg-[rgba(120,120,128,0.06)] dark:bg-[rgba(120,120,128,0.12)] rounded-[12px] space-y-2">
              <span className="text-[12px] font-semibold text-black dark:text-white block">
                Verify SMTP Connection
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Enter recipient email..."
                  className="input-apple flex-1 px-3 py-1.5 text-[13px]"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !testEmailRecipient}
                  className="btn-apple-secondary text-[12px] px-3.5 py-1.5 gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>{testingEmail ? 'Testing...' : 'Test SMTP'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`text-[12px] p-2.5 rounded-[8px] flex items-center space-x-2 ${
                  testResult.success 
                    ? 'bg-[#34C759]/10 text-[#34C759] dark:text-[#30D158] border border-[#34C759]/20' 
                    : 'bg-[#FF3B30]/10 text-[#FF3B30] dark:text-[#FF453A] border border-[#FF3B30]/20'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-apple-secondary text-[14px] px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-apple-primary text-[14px] px-5 py-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
