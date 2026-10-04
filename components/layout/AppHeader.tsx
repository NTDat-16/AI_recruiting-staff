"use client";

import React, { useState, useEffect } from "react";
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
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Mail,
  UserPlus,
  CheckCheck,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "ai_match" | "interview" | "application" | "evaluation" | "email";
  title: string;
  message: string;
  timestamp: string | null;
  is_read: boolean;
  priority: "high" | "normal" | "info";
  link_url?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "ai_match",
    title: "AI Match Xuất Sắc: 96.0%",
    message: "Ứng viên Đỗ Quỳnh Anh đạt độ tương thích 96.0% cho vị trí 'AI Research Scientist & LLM Specialist'.",
    timestamp: "10 phút trước",
    is_read: false,
    priority: "high",
    link_url: "/candidates",
  },
  {
    id: "notif-2",
    type: "interview",
    title: "Lịch phỏng vấn sắp diễn ra",
    message: "Buổi 'Phỏng vấn Kỹ thuật Chuyên sâu AI - Lê Thanh Tùng' lúc 14:00 qua Google Meet.",
    timestamp: "30 phút trước",
    is_read: false,
    priority: "high",
    link_url: "/interviews",
  },
  {
    id: "notif-3",
    type: "evaluation",
    title: "Phỏng vấn hoàn tất & Đã có Rubric",
    message: "Phiếu đánh giá phỏng vấn cho ứng viên Trần Gia Bảo đã hoàn tất: 9.2/10 (Strong Hire).",
    timestamp: "2 giờ trước",
    is_read: false,
    priority: "normal",
    link_url: "/evaluations",
  },
  {
    id: "notif-4",
    type: "email",
    title: "Đã phát hành Thư Mời Nhận Việc (Job Offer)",
    message: "Thư mời làm việc đã gửi tới Vũ Hoàng Long (long.vu.qa@qualityfirst.vn).",
    timestamp: "5 giờ trước",
    is_read: true,
    priority: "high",
    link_url: "/pipeline",
  },
  {
    id: "notif-5",
    type: "application",
    title: "Hồ sơ ứng tuyển mới",
    message: "Ứng viên Đinh Tuyết Mai vừa nộp hồ sơ ứng tuyển vị trí 'AI Research Scientist'.",
    timestamp: "Hôm qua",
    is_read: true,
    priority: "normal",
    link_url: "/candidates",
  },
];

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [notifTab, setNotifTab] = useState<"all" | "unread" | "interview" | "match">("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/v1/candidates/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications && data.notifications.length > 0) {
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count ?? data.notifications.filter((n: NotificationItem) => !n.is_read).length);
          }
        }
      } catch {
        // Keep default realistic notifications on fetch error
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setShowNotifications(false);
    if (item.link_url) {
      router.push(item.link_url);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifTab === "unread") return !n.is_read;
    if (notifTab === "interview") return n.type === "interview" || n.type === "evaluation";
    if (notifTab === "match") return n.type === "ai_match" || n.type === "application";
    return true;
  });

  // Xác định chế độ Cổng Ứng Viên (Candidate Portal) hay Bảng Điều Khiển Nhà Tuyển Dụng (Employer / ATS)
  const isCandidatePortal =
    pathname.startsWith("/careers") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/jobs/public");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/candidates?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // 1. Chế độ Cổng Ứng Viên (Candidate Portal)
  if (isCandidatePortal) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/careers" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                AI
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Cổng Tuyển Dụng & Việc Làm
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
    );
  }

  // 2. Chế độ Nhà Tuyển Dụng / Quản Trị ATS (Matching Studio Screenshots)
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs h-14 flex items-center px-4 justify-between">
      {/* Bên trái: App Launcher 3x3 + Logo + Bộ chuyển cổng phân đoạn */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Lưới 3x3 */}
        <button
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          title="Ứng dụng hệ sinh thái"
        >
          <Grid className="w-5 h-5 text-slate-600" />
        </button>

        {/* Logo & Tên Nền Tảng */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm tracking-wider shadow-sm shadow-blue-500/30">
            AI
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight whitespace-nowrap">
            AI Talent Suite
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
            AI ATS Core
          </span>
        </Link>

        {/* Bộ Chuyển Cổng (Segmented Portal Switcher) */}
        <div className="hidden md:flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 text-xs font-semibold ml-2">
          <Link
            href="/"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white text-blue-600 shadow-xs font-bold transition-all"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employer Portal</span>
          </Link>
          <Link
            href="/careers"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidate Portal (Website)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5"></span>
          </Link>
        </div>
      </div>

      {/* Bên phải: Tìm kiếm toàn cục + Cài đặt + Thông báo + Trợ giúp + Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Hộp tìm kiếm toàn cục */}
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

        <button
          onClick={() => setShowSearchModal(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          title="Tìm kiếm"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Nút cài đặt */}
        <button
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Cài đặt hệ thống"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Chuông thông báo */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center leading-none ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">Thông báo hoạt động</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-white px-2 pt-1 text-[11px] font-medium text-slate-500">
                <button
                  onClick={() => setNotifTab("all")}
                  className={`px-2.5 py-1.5 border-b-2 transition-all ${
                    notifTab === "all"
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab("unread")}
                  className={`px-2.5 py-1.5 border-b-2 transition-all ${
                    notifTab === "unread"
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
                <button
                  onClick={() => setNotifTab("interview")}
                  className={`px-2.5 py-1.5 border-b-2 transition-all ${
                    notifTab === "interview"
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent hover:text-slate-800"
                  }`}
                >
                  Lịch PV
                </button>
                <button
                  onClick={() => setNotifTab("match")}
                  className={`px-2.5 py-1.5 border-b-2 transition-all ${
                    notifTab === "match"
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent hover:text-slate-800"
                  }`}
                >
                  AI Match
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-medium">Không có thông báo nào trong danh mục</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const getIcon = () => {
                      switch (notif.type) {
                        case "ai_match":
                          return (
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          );
                        case "interview":
                          return (
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                          );
                        case "evaluation":
                          return (
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          );
                        case "email":
                          return (
                            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                          );
                        case "application":
                        default:
                          return (
                            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <UserPlus className="w-3.5 h-3.5" />
                            </div>
                          );
                      }
                    };

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleItemClick(notif)}
                        className={`p-3 flex items-start space-x-2.5 cursor-pointer transition-colors hover:bg-slate-50 ${
                          !notif.is_read ? "bg-blue-50/30" : "bg-white"
                        }`}
                      >
                        {getIcon()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p
                              className={`text-xs truncate ${
                                !notif.is_read
                                  ? "font-bold text-slate-900"
                                  : "font-medium text-slate-700"
                              }`}
                            >
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                            <span>{notif.timestamp || "Vừa xong"}</span>
                            {notif.priority === "high" && (
                              <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-100">
                                Quan trọng
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
                <Link
                  href="/candidates"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  Xem danh sách ứng viên & tiến trình →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Trợ giúp */}
        <button
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Trợ giúp & Hỗ trợ"
          onClick={() => alert("Trung tâm Trợ giúp AI Recruiting Platform")}
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center space-x-2 pl-1 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-blue-500/20">
            HR
          </div>
        </div>
      </div>

      {/* Modal tìm kiếm trên thiết bị nhỏ */}
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
