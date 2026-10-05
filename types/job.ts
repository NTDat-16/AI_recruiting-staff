export type JobStatus = "draft" | "pending_approval" | "published" | "paused" | "closed";

export interface JobPosting {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  department?: string;
  location?: string;
  salary_range?: string;
  description: string;
  requirements: string;
  ai_criteria_weights?: Record<string, number>;
  status: JobStatus;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface JobPostingCreate {
  title: string;
  department?: string;
  location?: string;
  salary_range?: string;
  description: string;
  requirements: string;
  ai_criteria_weights?: Record<string, number>;
  deadline?: string;
}
