import type { Metadata } from "next";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "AI Recruiting Platform - ATS Core",
  description: "Hệ thống quản trị tuyển dụng thông minh & ATS ứng dụng trí tuệ nhân tạo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthInitializer />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
