"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { CareerChatWidget } from "@/components/candidate/CareerChatWidget";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();

  // Kiểm tra nếu là cổng Ứng Viên Công Khai (Candidate Portal)
  const isCandidatePortal =
    pathname.startsWith("/careers") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/jobs/public");

  if (isCandidatePortal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Thanh tiêu đề Cổng Ứng Viên */}
        <AppHeader />

        {/* Nội dung ứng viên */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} AI Recruiting Platform • Cổng Tuyển Dụng Thông Minh
        </footer>

        {/* Chatbot 24/7 AI Career Assistant nổi góc phải */}
        <CareerChatWidget />
      </div>
    );
  }

  // Chế độ Bảng Điều Khiển Nhà Tuyển Dụng & Quản Trị ATS
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900">
      {/* Header điều hướng trên cùng */}
      <AppHeader />

      {/* Thân ứng dụng gồm Sidebar trái + Vùng nội dung chính */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu thanh bên trái */}
        <AppSidebar />

        {/* Vùng nội dung nghiệp vụ */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-[1700px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
