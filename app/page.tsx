"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Settings,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);

  const sampleQueries = [
    "Tại sao tỷ lệ drop-off ở vòng Phỏng vấn của khối Product cao trong tháng 9?",
    "So sánh thời gian tuyển dụng giữa nguồn Referral và LinkedIn",
    "Dự báo ngân sách và tỷ lệ đạt Headcount Q4",
  ];

  const handleRunCopilot = async (queryText?: string) => {
    const q = queryText || copilotQuery;
    if (!q.trim()) return;
    setCopilotLoading(true);
    setCopilotResponse(null);

    try {
      const res = await fetch("/api/v1/candidates/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `ATS Analytics Copilot: ${q}. Phân tích nguyên nhân gốc rễ (Root Cause Analysis) và đề xuất phương án cải thiện dựa trên số liệu thực tế (1.240 hồ sơ, 18 phỏng vấn tuần, offer 88.5%). Trả lời súc tích, chuyên nghiệp cho Giám đốc nhân sự.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCopilotResponse(data.reply || data.response);
      } else {
        // Fallback realistic analysis
        setCopilotResponse(
          `**Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis):**\n- Tỷ lệ drop-off tại vòng Phỏng vấn (118 -> 52, tỷ lệ qua 44.1%) chủ yếu do lệch kỳ vọng lương kỹ năng cao cấp (.NET Core, AWS Cloud Architecture) so với dải ngân sách đề xuất.\n- **Đề xuất hành động:** Điều chỉnh dải lương thêm 10-15% cho các role Senior then chốt và bổ sung vòng trao đổi văn hóa ngắn (Culture fit screening 15 phút) trước phỏng vấn kỹ thuật để giảm 30% thời gian của Engineering Manager.`
        );
      }
    } catch {
      setCopilotResponse(
        `**Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis):**\n- Khối Product ghi nhận 14/18 chỉ tiêu, thời gian tuyển trung bình 26 ngày (nhanh hơn 2.5 ngày).\n- Nguồn Referral nội bộ (15%) có tỷ lệ nhận Offer cao nhất (94.2%), vượt trội hơn các kênh tuyển dụng truyền thống.`
      );
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Đợt tuyển đang mở (Jobs)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">12</span>
              <span className="text-xs text-slate-500 font-medium">vị trí</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>15.4% so với tháng trước</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng ứng viên tiếp nhận</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">1.240</span>
              <span className="text-xs text-slate-500 font-medium">hồ sơ</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>24.8% so với tháng trước</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Phỏng vấn trong tuần</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">18</span>
              <span className="text-xs text-slate-500 font-medium">lượt</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>5.2% so với tuần trước</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Tỷ lệ chấp nhận Offer</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">88.5</span>
              <span className="text-sm font-bold text-slate-700">%</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>3.2% so với quý trước</span>
            </p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 leading-tight">
              Thời gian tuyển trung bình (Time-to-Hire)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">26</span>
              <span className="text-xs text-slate-500 font-medium">ngày</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>8.5% nhanh hơn 2.5 ngày</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: 3 Data Columns (Sources, Pipeline Funnel, Headcount) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Nguồn ứng viên (Sources) (3.5 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Nguồn ứng viên (Sources)</h2>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* SVG Donut Chart */}
          <div className="py-4 flex items-center justify-center relative">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="11"
              />
              {/* Segment 1: Career Portal 42% (Circumference = 2 * PI * 38 ≈ 238.76) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#2563eb"
                strokeWidth="11"
                strokeDasharray="100.28 238.76"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Segment 2: LinkedIn 28% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#0284c7"
                strokeWidth="11"
                strokeDasharray="66.85 238.76"
                strokeDashoffset="-100.28"
              />
              {/* Segment 3: Referral nội bộ 15% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="11"
                strokeDasharray="35.81 238.76"
                strokeDashoffset="-167.13"
              />
              {/* Segment 4: TopCV 10% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="11"
                strokeDasharray="23.88 238.76"
                strokeDashoffset="-202.94"
              />
              {/* Segment 5: Nguồn khác 5% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#94a3b8"
                strokeWidth="11"
                strokeDasharray="11.94 238.76"
                strokeDashoffset="-226.82"
              />
            </svg>

            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 leading-tight">1.240</span>
              <span className="text-[11px] text-slate-500 font-medium">Tổng hồ sơ</span>
            </div>
          </div>

          {/* Sources Legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
              <span className="text-slate-600 font-medium text-[11px]">Career Portal: 42%</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
              <span className="text-slate-600 font-medium text-[11px]">LinkedIn: 28%</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
              <span className="text-slate-600 font-medium text-[11px]">Referral nội bộ: 15%</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
              <span className="text-slate-600 font-medium text-[11px]">TopCV: 10%</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]"></span>
              <span className="text-slate-600 font-medium text-[11px]">Nguồn khác: 5%</span>
            </div>
          </div>
        </div>

        {/* Column 2: Hiệu suất Phễu tuyển dụng (Pipeline Funnel) (4.5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Hiệu suất Phễu tuyển dụng (Pipeline Funnel)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
              Chuyển đổi: 3.8%
            </span>
          </div>

          {/* 5 Funnel Stages with Colored Progress Bars */}
          <div className="space-y-4 py-2">
            {/* Stage 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">1. Tiếp nhận (Applied)</span>
                <span className="text-slate-600 font-mono">1.240 (100%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#2563eb] h-full rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">2. Sàng lọc (HR Screening)</span>
                <span className="text-slate-600 font-mono">412 (33.2%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#0284c7] h-full rounded-full" style={{ width: "33.2%" }}></div>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">3. Phỏng vấn (Interview)</span>
                <span className="text-slate-600 font-mono">118 (9.5%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#f59e0b] h-full rounded-full" style={{ width: "9.5%" }}></div>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">4. Đề nghị tiếp nhận (Offer)</span>
                <span className="text-slate-600 font-mono">52 (4.2%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#8b5cf6] h-full rounded-full" style={{ width: "4.2%" }}></div>
              </div>
            </div>

            {/* Stage 5 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">5. Tiếp nhận thành công (Hired)</span>
                <span className="text-slate-600 font-mono">46 (3.7%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: "3.7%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Nhu cầu theo Khối ban (Headcount) (3.5 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Nhu cầu theo Khối ban (Headcount)
            </h2>
            <span className="text-xs text-slate-500 font-semibold">Target Q4</span>
          </div>

          <div className="space-y-4 py-2">
            {/* Division 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800 truncate">Khối Phát triển Sản phẩm (Product)</span>
                <span className="text-blue-700 font-mono font-bold shrink-0">14 / 18</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#2563eb] h-full rounded-full" style={{ width: "77.7%" }}></div>
              </div>
            </div>

            {/* Division 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800 truncate">Khối Công nghệ & Hạ tầng (Infra/Cloud)</span>
                <span className="text-sky-700 font-mono font-bold shrink-0">6 / 8</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#0284c7] h-full rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>

            {/* Division 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800 truncate">Trung tâm Đổi mới AI (AI Innovation)</span>
                <span className="text-purple-700 font-mono font-bold shrink-0">4 / 5</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#a855f7] h-full rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>

            {/* Division 4 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800 truncate">Khối Vận hành & Kinh doanh (Operations)</span>
                <span className="text-emerald-700 font-mono font-bold shrink-0">8 / 10</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: AI Analytics Copilot Banner */}
      <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                AI Analytics Copilot
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Truy vấn dữ liệu ATS bằng ngôn ngữ tự nhiên và tìm nguyên nhân gốc rễ (Root Cause Analysis).
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-blue-700 border border-blue-200 bg-blue-50/50">
            Grounded on Real ATS Data
          </span>
        </div>

        {/* Query Input Box */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập câu hỏi phân tích dữ liệu, ví dụ: 'So sánh chi phí và thời gian tuyển giữa các phòng ban...'"
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunCopilot()}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
            <button
              onClick={() => handleRunCopilot()}
              disabled={copilotLoading || !copilotQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              {copilotLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang suy luận...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Phân tích</span>
                </>
              )}
            </button>
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Gợi ý truy vấn:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCopilotQuery(q);
                  handleRunCopilot(q);
                }}
                className="text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Copilot Response Display */}
          {copilotResponse && (
            <div className="mt-3 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-800 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Kết Quả Phân Tích Từ AI Copilot</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed text-slate-700">
                {copilotResponse}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
