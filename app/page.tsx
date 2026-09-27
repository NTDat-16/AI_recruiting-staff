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
      label: "CV trong hệ thống",
      value: statsData ? String(statsData.total_candidates) : "...",
      change: "Lưu trữ PostgreSQL",
      icon: "📄",
      color: "text-indigo-600",
    },
    {
      label: "Lịch phỏng vấn",
      value: statsData ? String(statsData.total_interviews) : "...",
      change: "Đã lên lịch Google Meet",
      icon: "🗓️",
      color: "text-amber-600",
    },
    {
      label: "Điểm phù hợp TB (AI Match)",
      value: statsData ? `${statsData.average_match_score}%` : "...",
      change: "Tính toán bởi Gemini AI",
      icon: "🎯",
      color: "text-emerald-600",
    },
  ];

  const recentCandidates: any[] = statsData?.recent_candidates || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng Điều Khiển Tuyển Dụng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan quy trình tuyển dụng ứng dụng trí tuệ nhân tạo (AI-Assisted Recruiting)
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
        {/* Recent Applications with AI Scores */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Ứng Viên Mới Chấm Điểm Bằng AI (Từ PostgreSQL)"
              subtitle="Tự động phân tích CV, so khớp yêu cầu JD và xếp hạng theo % độ phù hợp"
              action={
                <Link href="/candidates" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                  Xem tất cả pipeline →
                </Link>
              }
            />

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="text-center py-6 text-xs text-slate-400">Đang tải dữ liệu từ CSDL...</div>
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
                        {c.score}% Match
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

        {/* AI & Worker Status Side Panel */}
        <div className="space-y-6">
          <Card className="border-indigo-100 bg-indigo-50/20">
            <CardHeader
              title="Trạng Thái Hệ Thống AI & Worker"
              subtitle="Kiến trúc tách lớp theo tài liệu thiết kế"
            />
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-indigo-100/60">
                <span className="text-slate-600">LLM Provider (Trừu tượng hóa)</span>
                <span className="font-semibold text-indigo-700">Anthropic Claude / OpenAI / Mock</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-indigo-100/60">
                <span className="text-slate-600">Speech-to-Text Diarization</span>
                <span className="font-semibold text-emerald-700">Whisper API / AssemblyAI</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-indigo-100/60">
                <span className="text-slate-600">Celery Worker Xử Lý Nền</span>
                <span className="font-semibold text-emerald-700">Active (Redis Queue)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Human-in-the-loop Guardrail</span>
                <span className="font-semibold text-indigo-700">Bật (Con người duyệt cuối)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-100">
              <p className="text-[11px] text-slate-500 italic">
                * Mọi kết quả chấm điểm CV và phân tích transcript chỉ mang tính chất đề xuất hỗ trợ HR, không tự động loại ứng viên.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
