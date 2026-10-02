import { fetchApi } from "./client";
import { JobPosting, JobPostingCreate } from "@/types";

export const jobsApi = {
  getPublicJobs: () => fetchApi<JobPosting[]>("/jobs/public"),
  
  getPublicJobBySlug: (slug: string) => fetchApi<JobPosting>(`/jobs/public/${slug}`),

  getCompanyJobs: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return fetchApi<JobPosting[]>(`/jobs${query}`);
  },

  getJobDetail: (id: string) => fetchApi<JobPosting>(`/jobs/${id}`),

  createJob: (data: JobPostingCreate) =>
    fetchApi<JobPosting>("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  publishJob: (id: string) =>
    fetchApi<JobPosting>(`/jobs/${id}/publish`, {
      method: "POST",
    }),

  closeJob: (id: string) =>
    fetchApi<JobPosting>(`/jobs/${id}/close`, {
      method: "POST",
    }),
};
