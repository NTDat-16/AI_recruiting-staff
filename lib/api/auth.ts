import { fetchApi } from "./client";
import { AuthResponse, User } from "@/types";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: {
    email: string;
    password: string;
    full_name: string;
    company_name?: string;
    role?: string;
  }) =>
    fetchApi<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => fetchApi<User>("/auth/me"),
};
