"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  FileText,
  Briefcase,
  Users,
  ListFilter,
  Calendar,
  Database,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeType?: "default" | "ai";
}

const navItems: NavItem[] = [
  {
    name: "Tổng quan",
    href: "/",
    icon: Gauge,
  },
  {
    name: "Yêu cầu tuyển dụng",
    href: "/requests",
    icon: FileText,
  },
  {
    name: "Tin tuyển & JD",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    name: "Hồ sơ ứng viên",
    href: "/candidates",
    icon: Users,
  },
  {
    name: "Quy trình tuyển dụng",
    href: "/pipeline",
    icon: ListFilter,
  },
  {
    name: "Lịch phỏng vấn & AI",
    href: "/interviews",
    icon: Calendar,
  },
  {
    name: "Talent Pool & Rediscovery",
    href: "/talent-pool",
    icon: Database,
    badge: "AI",
    badgeType: "ai",
  },
  {
    name: "Báo cáo & Phân tích",
    href: "/reports",
    icon: BarChart3,
  },
];

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 shrink-0 z-40 select-none ${
        collapsed ? "w-16" : "w-56 lg:w-60"
      }`}
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      {/* Danh sách mục điều hướng */}
      <div className="py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate whitespace-nowrap tracking-tight">{item.name}</span>
                )}
              </div>

              {!collapsed && item.badge !== undefined && (
                <div>
                  {item.badgeType === "ai" ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                      {item.badge}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Chân sidebar với nút thu gọn / mở rộng */}
      <div className="p-2 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium space-x-2"
          title={collapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center space-x-2 w-full justify-start pl-1">
              <ChevronLeft className="w-4 h-4" />
              <Menu className="w-4 h-4" />
              <span className="text-[11px] text-slate-400">Thu gọn</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
