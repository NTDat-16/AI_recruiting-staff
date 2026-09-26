"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const stats = [
    { label: "Tin đang tuyển dụng", value: "8", change: "+2 tuần này", icon: "📢", color: "text-blue-600" },
    { label: "CV mới tiếp nhận", value: "42", change: "+15 hôm nay", icon: "📄", color: "text-indigo-600" },
    { label: "Lịch phỏng vấn tuần này", value: "12", change: "4 hôm nay", icon: "🗓️", color: "text-amber-600" },
    { label: "Điểm phù hợp TB (AI Match)", value: "82%", change: "+5% so với tháng trước", icon: "🎯", color: "text-emerald-600" },
  ];

  const recentCandidates = [
    { name: "Nguyễn Văn An", role: "Senior Python/FastAPI", score: 92, status: "Mời phỏng vấn", time: "10 phút trước" },
    { name: "Trần Thị Mai", role: "Frontend Next.js Engineer", score: 85, status: "Đang xem xét", time: "1 giờ trước" },
    { name: "Lê Hoàng Phúc", role: "AI/LLM Engineer", score: 88, status: "Đã phỏng vấn", time: "3 giờ trước" },
    { name: "Phạm Hải Đăng", role: "DevOps Engineer", score: 64, status: "Talent Pool", time: "Hôm qua" },
  ];

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
              title="Ứng Viên Mới Chấm Điểm Bằng AI"
              subtitle="Tự động phân tích CV, so khớp yêu cầu JD và xếp hạng theo % độ phù hợp"
              action={
                <Link href="/candidates" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                  Xem tất cả pipeline →
                </Link>
              }
            />

            <div className="divide-y divide-slate-100">
              {recentCandidates.map((c, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.role} • <span className="text-slate-400">{c.time}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={c.score >= 80 ? "success" : "warning"} className="font-mono font-bold">
                      {c.score}% Match
                    </Badge>
                    <span className="text-xs text-slate-600 hidden sm:inline-block">{c.status}</span>
                  </div>
                </div>
              ))}
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
