export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  recruiter_email?: string;
  salary?: string;
  tags: string[];
  created_at: string;
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  recommendation?: string;
}

export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  match_score: number;
  recruiter_email?: string;
  application_url?: string;
  status: 'DISCOVERED' | 'STAGED' | 'EMAIL_SENT' | 'FORM_APPLIED' | 'ACTION_REQUIRED' | 'INTERVIEW' | 'REJECTED' | 'ARCHIVED';
  email_subject?: string;
  email_body?: string;
  cover_letter?: string;
  cover_letter_pdf_path?: string;
  matched_skills: string[];
  missing_skills: string[];
  notes?: string;
  applied_at?: string;
  created_at: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  skills: string[];
  work_authorization: string;
  notice_period: string;
  salary_expectation: string;
  resume_file_path?: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password?: string;
  from_name: string;
  use_tls: boolean;
}

export interface AppSettings {
  autonomous_mode: boolean;
  auto_apply_threshold: number;
  daily_application_limit: number;
  target_titles: string[];
  preferred_locations: string[];
  smtp: SMTPSettings;
  llm_provider: string;
  llm_api_key?: string;
}

export interface DashboardMetrics {
  total_jobs_discovered: number;
  total_applications: number;
  high_matches: number;
  sent_total: number;
  sent_today: number;
  daily_limit: number;
  autonomous_mode: boolean;
  auto_apply_threshold: number;
}
