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
      // First save current form data so backend has the credentials
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-slate-900 text-lg">Agent Settings & Email Gateway</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {/* Section: Autonomous Mode & Guardrails */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
              Automation Mode & Guardrails
            </h4>

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setFormData({ ...formData, autonomous_mode: false })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  !formData.autonomous_mode
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-sky-600" />
                  <span className="font-semibold text-slate-900">Tier 1: Supervised (Default)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Agent aggregates jobs and prepares tailored emails/letters, but requires your 1-click review to send.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, autonomous_mode: true })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.autonomous_mode
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-900">Tier 2: Full Auto-Pilot</span>
                </div>
                <p className="text-xs text-slate-500">
                  Autonomously dispatches emails and submits forms for jobs meeting your score threshold.
                </p>
              </div>
            </div>

            {/* Threshold & Rate limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Auto-Apply Match Threshold: <strong className="text-slate-900">{formData.auto_apply_threshold}%</strong>
                </label>
                <input
                  type="range"
                  min={60}
                  max={95}
                  step={5}
                  value={formData.auto_apply_threshold}
                  onChange={(e) => setFormData({ ...formData, auto_apply_threshold: Number(e.target.value) })}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Daily Application Cap (Anti-Spam Limit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.daily_application_limit}
                  onChange={(e) => setFormData({ ...formData, daily_application_limit: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: SMTP Email Configuration */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
              SMTP Recruiter Email Gateway
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={formData.smtp.host}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, host: e.target.value } })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Port</label>
                <input
                  type="number"
                  value={formData.smtp.port}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, port: Number(e.target.value) } })}
                  placeholder="587"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email / Username</label>
                <input
                  type="email"
                  value={formData.smtp.username}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, username: e.target.value } })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">App Password (Secret)</label>
                <input
                  type="password"
                  value={formData.smtp.password || ''}
                  onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, password: e.target.value } })}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sender Name (From Header)</label>
              <input
                type="text"
                value={formData.smtp.from_name}
                onChange={(e) => setFormData({ ...formData, smtp: { ...formData.smtp, from_name: e.target.value } })}
                placeholder="Kunal Gursal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {/* Test Email Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-medium text-slate-700 block">Verify SMTP Connection</span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Enter email to receive test message..."
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !testEmailRecipient}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-60"
                >
                  <Send className="w-3 h-3" />
                  <span>{testingEmail ? 'Sending...' : 'Test SMTP'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`text-xs p-2 rounded-lg flex items-center space-x-1.5 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-60 shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
