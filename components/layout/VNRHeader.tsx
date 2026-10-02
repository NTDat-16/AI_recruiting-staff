"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Grid,
  Search,
  Settings,
  Bell,
  HelpCircle,
  Briefcase,
  Users,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";

export const VNRHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const isCandidatePortal =
    pathname.startsWith("/careers") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/jobs/public");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/candidates?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs h-14 flex items-center px-4 justify-between">
      {/* Left: App Launcher + Logo + Portal Switcher */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* 3x3 App Launcher */}
        <button
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          title="Ứng dụng VNR"
        >
          <Grid className="w-5 h-5 text-slate-600" />
        </button>

        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base tracking-wider shadow-sm shadow-blue-500/30">
            V
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight whitespace-nowrap">
            VNR Talent Suite
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
            AI ATS Core
          </span>
        </Link>

        {/* Segmented Portal Switcher */}
        <div className="hidden md:flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 text-xs font-semibold ml-2">
          <Link
            href="/"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              !isCandidatePortal
                ? "bg-white text-blue-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employer Portal</span>
          </Link>
          <Link
            href="/careers"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              isCandidatePortal
                ? "bg-white text-emerald-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidate Portal (Website)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5"></span>
          </Link>
        </div>
      </div>

      {/* Right: Global Search + Icons + Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block w-64 xl:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm ứng viên, job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </form>

        {/* Mobile Search Trigger */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          title="Tìm kiếm"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Cài đặt hệ thống"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center leading-none">
              1
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Thông báo mới</span>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Đánh dấu đã đọc
                </span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start space-x-2.5">
                  <span className="text-base">✨</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">AI Matching Đạt 94%</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Ứng viên <strong>Nguyễn Văn An</strong> có độ khớp 94% với vị trí Senior Backend (.NET).
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">10 phút trước</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <a
          href="/AI_RECRUITING_SRS_SPECIFICATION_v2.4.0.pdf"
          target="_blank"
          rel="noreferrer"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Tài liệu & Bản đặc tả SRS"
        >
          <HelpCircle className="w-4 h-4" />
        </a>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-1 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-blue-500/20">
            NT
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Tìm kiếm nhanh</span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                handleSearchSubmit(e);
                setShowSearchModal(false);
              }}
              className="mt-3 relative"
            >
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm ứng viên, kỹ năng, mã job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
