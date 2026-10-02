export type PipelineStatus =
  | "new"
  | "reviewing"
  | "interview_invited"
  | "interviewed"
  | "offered"
  | "hired"
  | "rejected"
  | "talent_pool";

export interface CriteriaScore {
  name: string;
  weight: number;
  score: number;
  explanation: string;
}

export interface ScoreBreakdown {
  overall_score: number;
  breakdown: CriteriaScore[];
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface Application {
  id: string;
  job_posting_id: string;
  job_title?: string;
  candidate_id: string;
  match_score?: number;
  score_breakdown?: ScoreBreakdown;
  status: PipelineStatus;
  hr_notes?: string;
  hr_feedback?: {
    accuracy_rating: number;
    comment?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  cv_file_url?: string;
  parsed_data?: Record<string, any>;
  tags: string[];
  hr_notes?: string;
  rating: number;
  source: string;
  created_at: string;
  applications: Application[];
}
