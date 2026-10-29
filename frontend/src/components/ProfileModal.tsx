import React, { useState } from 'react';
import { X, User, Upload, CheckCircle2, FileText } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => Promise<void>;
  onUploadResume: (file: File) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onUploadResume,
}) => {
  const [formData, setFormData] = useState<UserProfile | null>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  if (!isOpen || !formData) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      await onUploadResume(file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-apple-5 max-w-2xl w-full border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.35)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
              <User className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-black dark:text-white text-[17px] tracking-tight">
              Candidate Resume & Profile
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
          
          {/* Resume Upload Box (Apple Style) */}
          <div className="p-4 bg-[rgba(0,122,255,0.05)] dark:bg-[rgba(10,132,255,0.10)] rounded-[14px] border border-[#007AFF]/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#007AFF]/15 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
                <FileText className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <span className="font-semibold text-black dark:text-white text-[13px] block">
                  Active Resume PDF
                </span>
                <span className="text-[12px] text-[rgba(60,60,67,0.65)] dark:text-[rgba(235,235,245,0.65)] truncate max-w-xs block font-mono">
                  {formData.resume_file_path || 'Kunal_Gursal_Resume.pdf'}
                </span>
              </div>
            </div>

            <label className="btn-apple-secondary text-[12px] px-3.5 py-1.5 h-8 gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{isUploading ? 'Parsing...' : 'Upload New PDF'}</span>
              <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {uploadSuccess && (
            <div className="p-3 bg-[#34C759]/10 border border-[#34C759]/20 rounded-[10px] text-[12px] text-[#34C759] dark:text-[#30D158] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>Resume parsed! Updated skills and candidate metadata extracted.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Target Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                LinkedIn Profile
              </label>
              <input
                type="text"
                value={formData.linkedin || ''}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
                GitHub Profile
              </label>
              <input
                type="text"
                value={formData.github || ''}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                className="input-apple w-full px-3 py-2 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)] mb-1">
              Professional Summary
            </label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="input-apple w-full px-3 py-2 text-[14px] leading-relaxed resize-none"
            />
          </div>

          {/* Skill Tag Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-semibold text-[rgba(60,60,67,0.7)] dark:text-[rgba(235,235,245,0.7)]">
                Skills & Technical Competencies ({formData.skills.length})
              </label>
              <span className="text-[11px] text-[rgba(60,60,67,0.5)]">Press Enter or click Add</span>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                id="new-skill-input"
                placeholder="Type a skill (e.g. PyTorch, Kubernetes)..."
                className="input-apple flex-1 px-3 py-1.5 text-[13px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !formData.skills.includes(val)) {
                      setFormData({ ...formData, skills: [...formData.skills, val] });
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-skill-input') as HTMLInputElement;
                  if (input && input.value.trim() && !formData.skills.includes(input.value.trim())) {
                    setFormData({ ...formData, skills: [...formData.skills, input.value.trim()] });
                    input.value = '';
                  }
                }}
                className="btn-apple-secondary text-[12px] px-3.5 py-1.5 cursor-pointer"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 p-3 bg-[rgba(120,120,128,0.06)] dark:bg-[rgba(120,120,128,0.12)] rounded-[12px] max-h-36 overflow-y-auto">
              {formData.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-[#2C2C2E] shadow-apple-1 text-black dark:text-white rounded-[6px] text-[12px] font-medium">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        skills: formData.skills.filter((s) => s !== skill),
                      });
                    }}
                    className="text-[rgba(60,60,67,0.4)] hover:text-[#FF3B30] dark:hover:text-[#FF453A] font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.skills.length === 0 && (
                <span className="text-[12px] text-[rgba(60,60,67,0.5)] italic">No skills listed. Type above to add.</span>
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
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
