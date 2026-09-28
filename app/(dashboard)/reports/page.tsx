"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReportsDashboardPage() {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalCandidates = statsData?.total_candidates || 1;
  const funnel = statsData?.pipeline_funnel || {};
  const totalApps = (funnel.new || 0) + (funnel.reviewing || 0) + (funnel.interview_invited || 0) + (funnel.interviewed || 0) + (funnel.offered || 0) + (funnel.hired || 0) + (funnel.talent_pool || 0) || totalCandidates;

  const funnelSteps = [
    { label: "Nộp hồ sơ CV", count: totalApps, percent: "100%", color: "bg-indigo-600" },
    { label: "Sàng lọc & Đang xem xét", count: (funnel.reviewing || 0) + (funnel.interview_invited || 0) + (funnel.interviewed || 0) + (funnel.offered || 0) + (funnel.hired || 0), percent: `${Math.round((((funnel.reviewing || 0) + (funnel.interview_invited || 0) + (funnel.interviewed || 0) + (funnel.offered || 0) + (funnel.hired || 0)) / (totalApps || 1)) * 100)}%`, color: "bg-indigo-500" },
    { label: "Phỏng vấn chuyên môn", count: (funnel.interview_invited || 0) + (funnel.interviewed || 0) + (funnel.offered || 0) + (funnel.hired || 0), percent: `${Math.round((((funnel.interview_invited || 0) + (funnel.interviewed || 0) + (funnel.offered || 0) + (funnel.hired || 0)) / (totalApps || 1)) * 100)}%`, color: "bg-amber-500" },
    { label: "Gửi Thư Mời (Offer)", count: (funnel.offered || 0) + (funnel.hired || 0), percent: `${Math.round((((funnel.offered || 0) + (funnel.hired || 0)) / (totalApps || 1)) * 100)}%`, color: "bg-emerald-500" },
    { label: "Gia nhập (Hired)", count: funnel.hired || 0, percent: `${Math.round(((funnel.hired || 0) / (totalApps || 1)) * 100)}%`, color: "bg-teal-600" },
  ];

  const sourceBreakdown: Array<{ source: string; count: number; percent: string }> = statsData?.sources?.length
    ? statsData.sources
    : [{ source: "Cổng tuyển dụng Website trực tiếp", count: totalCandidates, percent: "100%" }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Báo Cáo & Phân Tích Tuyển Dụng</h1>
        <p className="text-xs text-slate-500 mt-1">
          Thống kê hiệu quả tuyển dụng và tỷ lệ chuyển đổi qua các giai đoạn tuyển chọn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số ứng viên</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{statsData ? `${statsData.total_candidates} ứng viên` : "..."}</p>
          <p className="text-xs text-emerald-600 mt-1">Đã tiếp nhận hồ sơ</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Lịch phỏng vấn</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{statsData ? `${statsData.total_interviews} buổi` : "..."}</p>
          <p className="text-xs text-slate-500 mt-1">Đã lên lịch thực hiện</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Độ phù hợp trung bình</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{statsData ? `${statsData.average_match_score}%` : "..."}</p>
          <p className="text-xs text-indigo-600 mt-1">Chỉ số tương thích công việc</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Graph */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Phễu Tuyển Dụng"
              subtitle="Tỷ lệ chuyển đổi qua từng giai đoạn tuyển dụng"
            />
            <div className="space-y-4 py-2">
              {funnelSteps.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 font-semibold">{step.label}</span>
                    <span className="text-slate-500">
                      {step.count} ứng viên <span className="font-bold text-slate-700">({step.percent})</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${step.color} transition-all duration-500`}
                      style={{ width: step.percent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Source Breakdown */}
        <div>
          <Card>
            <CardHeader
              title="Nguồn Tuyển Dụng Hiệu Quả"
              subtitle="Phân bố theo kênh ứng tuyển"
            />
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {sourceBreakdown.map((item, idx) => (
                <div key={idx} className="pt-2.5 flex justify-between items-center">
                  <span className="text-slate-700">{item.source}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{item.count}</span>
                    <span className="text-slate-400 ml-1">({item.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
