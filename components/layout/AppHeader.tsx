"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AppHeader: React.FC = () => {
  const pathname = usePathname();

  // Xác định chế độ Cổng Ứng Viên (Candidate Portal) hay Bảng Điều Khiển Nhà Tuyển Dụng (Recruiter/HR)
  const isCandidatePortal =
    pathname.startsWith("/jobs/public") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/careers") ||
    (pathname.startsWith("/jobs/") && pathname !== "/jobs");

  if (isCandidatePortal) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/jobs/public" className="flex items-center space-x-2.5">
              <span className="text-2xl">💼</span>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Cổng Tuyển Dụng
              </span>
            </Link>
            <nav className="hidden sm:flex space-x-1 text-sm font-medium text-slate-600">
              <Link
                href="/jobs/public"
                className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Cơ Hội Việc Làm
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <span>Dành Cho Nhà Tuyển Dụng</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Chế độ Nhà Tuyển Dụng / HR Quản Trị
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              AI Recruiting
            </span>
          </Link>
          <nav className="hidden md:flex space-x-1 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === "/" ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/jobs"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith("/jobs") ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Tin Tuyển Dụng
            </Link>
            <Link
              href="/candidates"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith("/candidates") ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Ứng Viên & Pipeline
            </Link>
            <Link
              href="/interviews"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith("/interviews") ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Lịch Phỏng Vấn
            </Link>
            <Link
              href="/evaluations"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith("/evaluations") ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Đánh Giá
            </Link>
            <Link
              href="/reports"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith("/reports") ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Báo Cáo
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/jobs/public"
            target="_blank"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <span>Cổng Ứng Viên</span>
            <span className="text-[10px]">↗</span>
          </Link>
          <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            HR
          </div>
        </div>
      </div>
    </header>
  );
};
