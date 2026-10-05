import { fetchApi } from "./client";
import { Interview, InterviewCreate } from "@/types";

export const interviewsApi = {
  getInterviews: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return fetchApi<Interview[]>(`/interviews${query}`);
  },

  getInterviewDetail: (id: string) => fetchApi<Interview>(`/interviews/${id}`),

  scheduleInterview: (data: InterviewCreate) =>
    fetchApi<Interview>("/interviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  suggestQuestions: (interviewId: string) =>
    fetchApi<{ interview_id: string; questions: any[] }>(
      `/interviews/${interviewId}/suggest-questions`,
      { method: "POST" }
    ),

  confirmInterview: (interviewId: string, action: string, note?: string) =>
    fetchApi<Interview>(`/interviews/${interviewId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ action, note }),
    }),
};
