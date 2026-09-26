"use client";

import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReportsDashboardPage() {
  const funnelSteps = [
    { label: "Nộp CV", count: 120, percent: "100%", color: "bg-indigo-600" },
    { label: "Sàng lọc CV (AI >= 70%)", count: 54, percent: "45%", color: "bg-indigo-500" },
    { label: "Phỏng vấn chuyên môn", count: 22, percent: "18.3%", color: "bg-amber-500" },
    { label: "Gửi Thư Mời (Offer)", count: 8, percent: "6.7%", color: "bg-emerald-500" },
    { label: "Gia nhập (Hired)", count: 6, percent: "5.0%", color: "bg-teal-600" },
  ];

  const sourceBreakdown = [
    { source: "Cổng tuyển dụng Website trực tiếp", count: 65, percent: "54%" },
    { source: "Giới thiệu nội bộ (Referral)", count: 28, percent: "23%" },
    { source: "LinkedIn Jobs", count: 18, percent: "15%" },
    { source: "Khác", count: 9, percent: "8%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Báo Cáo & Phân Tích Tuyển Dụng</h1>
        <p className="text-xs text-slate-500 mt-1">
          Đo lường phễu tuyển dụng (Recruitment Funnel), tỷ lệ chuyển đổi và thời gian tuyển trung bình (Time-to-Hire)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Thời gian tuyển TB (Time-to-Hire)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">16.5 ngày</p>
          <p className="text-xs text-emerald-600 mt-1">▼ Giảm 4.2 ngày nhờ AI sàng lọc</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tỷ lệ chấp nhận Offer</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">75%</p>
          <p className="text-xs text-slate-500 mt-1">6 / 8 ứng viên nhận offer</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Độ hài lòng AI Matching</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">4.6 / 5.0 ★</p>
          <p className="text-xs text-indigo-600 mt-1">Đánh giá từ HR qua Human-in-the-loop</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Graph */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Phễu Tuyển Dụng (Recruitment Funnel Analytics)"
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
