import type { Metadata } from "next";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "AI Recruiting Platform - Tuyển Dụng Thông Minh",
  description: "Nền tảng website tuyển dụng ứng dụng AI hỗ trợ sàng lọc CV, phỏng vấn và đánh giá",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <AuthInitializer />
        {/* Navigation Bar */}
        <AppHeader />

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} AI Recruiting Platform • Hệ Thống Quản Trị Tuyển Dụng Thông Minh
        </footer>
      </body>
    </html>
  );
}
