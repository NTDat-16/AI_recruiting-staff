export type UserRole = "super_admin" | "company_admin" | "hr" | "interviewer" | "candidate";

export interface User {
  id: string;
  company_id?: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: UserRole;
  company_id?: string;
  full_name: string;
}
