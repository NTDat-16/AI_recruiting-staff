export interface TranscriptSegment {
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface RubricScore {
  criterion: string;
  score: number;
  evidence_quote?: string;
  comment?: string;
}

export interface InterviewEvaluation {
  id: string;
  interview_id: string;
  application_id: string;
  interviewer_id?: string;
  manual_score?: number;
  manual_rubric_scores: RubricScore[];
  manual_notes?: string;
  audio_file_url?: string;
  candidate_audio_consent?: string;
  transcript: TranscriptSegment[];
  ai_rating?: number;
  ai_summary?: string;
  ai_rubric_scores: RubricScore[];
  ai_strengths: string[];
  ai_weaknesses: string[];
  ai_recommendation?: string;
  created_at: string;
}

export interface ConsolidatedReport {
  evaluation_id: string;
  interview_id: string;
  candidate_name: string;
  job_title: string;
  scheduled_time: string;
  manual_evaluation: {
    score?: number;
    rubric_scores: RubricScore[];
    notes?: string;
  };
  ai_evaluation: {
    rating?: number;
    summary?: string;
    rubric_scores: RubricScore[];
    strengths: string[];
    weaknesses: string[];
    recommendation?: string;
    transcript: TranscriptSegment[];
  };
  final_decision_guideline: string;
}
