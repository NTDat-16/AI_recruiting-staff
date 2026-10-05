import { fetchApi } from "./client";
import { Candidate, Application, PipelineStatus } from "@/types";

export const candidatesApi = {
  getCandidates: (jobId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (jobId) params.append("job_id", jobId);
    if (status) params.append("status", status);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchApi<Candidate[]>(`/candidates${queryString}`);
  },

  getCandidateDetail: (id: string) => fetchApi<Candidate>(`/candidates/${id}`),

  applyPublic: (formData: FormData) =>
    fetchApi<Application>("/candidates/apply", {
      method: "POST",
      body: formData,
    }),

  hrUploadCv: (formData: FormData) =>
    fetchApi<Application>("/candidates/upload-cv", {
      method: "POST",
      body: formData,
    }),

  updatePipelineStatus: (applicationId: string, status: PipelineStatus, hrNotes?: string) =>
    fetchApi<Application>(`/candidates/applications/${applicationId}/pipeline-status`, {
      method: "PATCH",
      body: JSON.stringify({ status, hr_notes: hrNotes }),
    }),

  submitScoreFeedback: (applicationId: string, accuracyRating: number, comment?: string) =>
    fetchApi<Application>(`/candidates/applications/${applicationId}/score-feedback`, {
      method: "POST",
      body: JSON.stringify({ accuracy_rating: accuracyRating, comment }),
    }),
};
