import { fetchApi } from "./client";
import { InterviewEvaluation, ConsolidatedReport } from "@/types";

export const evaluationsApi = {
  submitManualEvaluation: (data: {
    interview_id: string;
    manual_score: number;
    manual_rubric_scores: { criterion: string; score: number; comment?: string }[];
    manual_notes?: string;
  }) =>
    fetchApi<InterviewEvaluation>("/evaluations/manual", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadAudio: (formData: FormData) =>
    fetchApi<InterviewEvaluation>("/evaluations/upload-audio", {
      method: "POST",
      body: formData,
    }),

  getConsolidatedReport: (interviewId: string) =>
    fetchApi<ConsolidatedReport>(`/evaluations/interview/${interviewId}/consolidated-report`),
};
