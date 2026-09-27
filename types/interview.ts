export type InterviewFormat = "online" | "offline";
export type ConfirmationStatus = "pending" | "confirmed" | "reschedule_requested" | "declined" | "no_response";

export interface SuggestedQuestion {
  category: string;
  question: string;
  rationale: string;
  expected_answer_points: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface Interview {
  id: string;
  application_id: string;
  company_id: string;
  interviewer_id?: string;
  title: string;
  round_number: number;
  scheduled_time: string;
  duration_minutes: number;
  format: InterviewFormat;
  meeting_link?: string;
  location?: string;
  confirmation_status: ConfirmationStatus;
  ai_suggested_questions?: SuggestedQuestion[];
  created_at: string;
}

export interface InterviewCreate {
  application_id: string;
  interviewer_id?: string;
  title: string;
  round_number: number;
  scheduled_time: string;
  duration_minutes: number;
  format: InterviewFormat;
  location?: string;
}
