"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/candidates/overview/stats", { headers });
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (e) {
        console.error("Fetch dashboard stats error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      label: "Tin đang tuyển dụng",
      value: statsData ? String(statsData.total_jobs) : "...",
      change: "Đang mở nhận hồ sơ",
      icon: "📢",
      color: "text-blue-600",
    },
    {
      label: "Tổng số hồ sơ",
      value: statsData ? String(statsData.total_candidates) : "...",
      change: "Đã tiếp nhận",
      icon: "📄",
      color: "text-indigo-600",
    },
    {
      label: "Lịch phỏng vấn",
      value: statsData ? String(statsData.total_interviews) : "...",
      change: "Sắp diễn ra",
      icon: "🗓️",
      color: "text-amber-600",
    },
    {
      label: "Độ phù hợp trung bình",
      value: statsData ? `${statsData.average_match_score}%` : "...",
      change: "Chỉ số tương thích",
      icon: "🎯",
      color: "text-emerald-600",
    },
  ];

  const recentCandidates: any[] = statsData?.recent_candidates || [];
  const funnel = statsData?.pipeline_funnel || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng Điều Khiển Tuyển Dụng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan hiệu quả tiếp nhận hồ sơ, tiến độ tuyển chọn và lịch phỏng vấn
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              + Đăng Tin Tuyển Dụng
            </Button>
          </Link>
          <Link href="/candidates">
            <Button size="sm">
              📥 Tiếp Nhận & Sàng Lọc CV
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stat.change}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications with Scores */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Ứng Viên Mới Ứng Tuyển"
              subtitle="Danh sách ứng viên nộp hồ sơ gần đây và mức độ phù hợp công việc"
              action={
                <Link href="/candidates" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                  Xem tất cả pipeline →
                </Link>
              }
            />

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="text-center py-6 text-xs text-slate-400">Đang tải danh sách ứng viên...</div>
              ) : recentCandidates.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Chưa có ứng viên nào trong hệ thống.</div>
              ) : (
                recentCandidates.map((c, i) => (
                  <Link
                    key={i}
                    href={`/candidates/${c.candidate_id}`}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 -mx-3 px-3 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <CandidateAvatar src={c.avatar_url} name={c.name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-500">{c.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge variant={c.score >= 80 ? "success" : "warning"} className="font-mono font-bold">
                        {c.score}% Phù hợp
                      </Badge>
                      <span className="text-xs text-slate-600 hidden sm:inline-block">{c.status}</span>
                      <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem chi tiết →
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recruitment Pipeline Summary Side Panel */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader
              title="Tiến Độ Phễu Tuyển Dụng"
              subtitle="Phân bổ số lượng ứng viên theo giai đoạn"
            />
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Hồ sơ mới nộp</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                  {funnel.new || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Đang sàng lọc</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {funnel.reviewing || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Vòng phỏng vấn</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {(funnel.interview_invited || 0) + (funnel.interviewed || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Đề xuất tuyển dụng (Offer)</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {funnel.offered || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 font-medium">Đã tiếp nhận (Hired)</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  {funnel.hired || 0}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/reports"
                className="w-full block text-center py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Xem báo cáo phân tích chi tiết →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
