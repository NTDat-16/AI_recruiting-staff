"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrackItem {
  application_id: string;
  candidate_name: string;
  candidate_email: string;
  job_id: string;
  job_title: string;
  department?: string;
  location?: string;
  status: string;
  status_label: string;
  step: number;
  progress: number;
  description: string;
  applied_at?: string;
  updated_at?: string;
}

export default function CandidateTrackingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<TrackItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/v1/candidates/track/status?email=${encodeURIComponent(email.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        throw new Error("Không thể kết nối máy chủ tra cứu");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tra cứu");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Tiếp nhận" },
    { num: 2, label: "Sàng lọc CV" },
    { num: 3, label: "Phỏng vấn" },
    { num: 4, label: "Đề xuất (Offer)" },
    { num: 5, label: "Tuyển dụng" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Tra Cứu Trạng Thái Hồ Sơ Ứng Tuyển
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Nhập địa chỉ email bạn đã sử dụng khi nộp hồ sơ để theo dõi tiến độ xét duyệt trực tiếp theo thời gian thực mà không cần đăng nhập tài khoản.
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-6 bg-white shadow-sm border-slate-200">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              📧
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn (ví dụ: candidate@example.com)"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="px-6 font-semibold">
            {loading ? "Đang tra cứu..." : "🔍 Kiểm Tra Tiến Độ"}
          </Button>
        </form>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {searched && !loading && results.length === 0 && !error && (
        <Card className="text-center py-12 px-4 space-y-3">
          <div className="text-4xl">🔎</div>
          <h3 className="font-bold text-slate-800 text-base">Chưa tìm thấy hồ sơ với email này</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vui lòng kiểm tra lại địa chỉ email hoặc đảm bảo bạn đã hoàn tất nộp đơn ứng tuyển cho vị trí mong muốn.
          </p>
          <div className="pt-2">
            <Link href="/careers">
              <Button variant="outline" size="sm">
                ← Xem danh sách vị trí đang tuyển
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Tìm thấy <strong>{results.length}</strong> hồ sơ ứng tuyển liên quan</span>
            <span>Ứng viên: <strong>{results[0]?.candidate_name}</strong></span>
          </div>

          {results.map((item) => (
            <Card key={item.application_id} className="p-6 border-slate-200 shadow-sm space-y-6">
              {/* Job & Status Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{item.job_title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    {item.department && <span>🏢 {item.department}</span>}
                    {item.location && <span>📍 {item.location}</span>}
                    {item.applied_at && <span>🕒 Ngày nộp: {item.applied_at}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.status === "hired" || item.status === "offered"
                        ? "success"
                        : item.status === "interview_invited" || item.status === "interviewed"
                        ? "warning"
                        : "info"
                    }
                    className="text-xs font-semibold px-3 py-1"
                  >
                    {item.status_label}
                  </Badge>
                </div>
              </div>

              {/* Step Progress Timeline */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Tiến trình xét duyệt:</span>
                  <span className="font-bold text-indigo-600">{item.progress}% hoàn thành</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {/* Steps Nodes */}
                <div className="grid grid-cols-5 text-center pt-2">
                  {stepsList.map((st) => {
                    const isDone = item.step >= st.num;
                    const isCurrent = item.step === st.num;
                    return (
                      <div key={st.num} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                              : isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isDone && !isCurrent ? "✓" : st.num}
                        </div>
                        <span
                          className={`text-[11px] font-medium leading-tight ${
                            isCurrent
                              ? "text-indigo-700 font-bold"
                              : isDone
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Explanation Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">Thông báo từ Hội đồng Tuyển dụng:</p>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  {item.updated_at && (
                    <p className="text-[11px] text-slate-400 pt-1">
                      Cập nhật lần cuối: {item.updated_at}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
