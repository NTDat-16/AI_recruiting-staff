"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { VNRHeader } from "./VNRHeader";
import { VNRSidebar } from "./VNRSidebar";
import { CareerChatWidget } from "@/components/candidate/CareerChatWidget";
import Link from "next/link";

interface VNRAppShellProps {
  children: React.ReactNode;
}

export const VNRAppShell: React.FC<VNRAppShellProps> = ({ children }) => {
  const pathname = usePathname();

  // Kiểm tra nếu là cổng Ứng Viên Công Khai (Candidate Portal)
  const isCandidatePortal =
    pathname.startsWith("/careers") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/jobs/public");

  if (isCandidatePortal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Candidate Portal Top Navigation */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/careers" className="flex items-center space-x-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                  V
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Cổng Tuyển Dụng VNR
                </span>
              </Link>
              <nav className="hidden sm:flex space-x-1 text-sm font-medium text-slate-600">
                <Link
                  href="/careers"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === "/careers" || pathname === "/jobs/public"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Cơ Hội Việc Làm
                </Link>
                <Link
                  href="/careers/track"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === "/careers/track"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  🔍 Tra Cứu Hồ Sơ
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="/AI_RECRUITING_SRS_SPECIFICATION_v2.4.0.pdf"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>📄 Bản Đặc Tả SRS (PDF)</span>
              </a>
              <Link
                href="/"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Cổng Nhà Tuyển Dụng</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Candidate Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} VNR Talent Suite • Cổng Tuyển Dụng Thông Minh
        </footer>

        {/* 24/7 AI Career Assistant Floating Widget */}
        <CareerChatWidget />
      </div>
    );
  }

  // Employer Portal (Nhà Tuyển Dụng & Quản Trị ATS)
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900">
      {/* Top Header */}
      <VNRHeader />

      {/* Main Body with Left Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Fixed Navigation Sidebar */}
        <VNRSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-[1700px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
