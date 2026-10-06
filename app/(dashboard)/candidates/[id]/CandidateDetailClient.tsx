"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Candidate } from "@/types";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { MatchScoreCard } from "@/components/candidate/MatchScoreCard";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/formatters";

interface CandidateDetailClientProps {
  id: string;
}

export function CandidateDetailClient({ id }: CandidateDetailClientProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidate = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch(`/api/v1/candidates/${id}`, { headers });
      if (res.status === 401) {
        // Auto-login demo account and retry
        try {
          const authRes = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "demo.hr@recruiting.vn",
              password: "Demo123456@",
            }),
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            token = authData.access_token;
            if (token && typeof window !== "undefined") {
              localStorage.setItem("auth_token", token);
              headers["Authorization"] = `Bearer ${token}`;
            }
            res = await fetch(`/api/v1/candidates/${id}`, { headers });
          }
        } catch (authErr) {
          console.warn("Auto-login retry error:", authErr);
        }
      }

      if (res.ok) {
        const data = await res.json();
        setCandidate(data);
        if (data.applications && data.applications.length > 0) {
          // If the URL id matches an application id, select it specifically
          const matchedApp = data.applications.find((a: any) => a.id === id);
          setSelectedAppId(matchedApp ? matchedApp.id : data.applications[0].id);
        }
      } else {
        const errText = await res.text().catch(() => "");
        setError("Không tìm thấy dữ liệu ứng viên trong hệ thống.");
        setCandidate(null);
      }
    } catch (e: any) {
      console.error("Error loading candidate from DB:", e);
      setError(e.message || "Lỗi kết nối máy chủ dữ liệu.");
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Đang tải hồ sơ ứng viên và kết quả chấm điểm AI...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-4xl">👤</div>
        <h3 className="text-lg font-bold text-slate-800">Không Thể Tải Hồ Sơ Ứng Viên</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || "Hồ sơ ứng viên có thể đã được lưu trữ hoặc mã định danh không chính xác."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={fetchCandidate}>
            🔄 Thử tải lại
          </Button>
          <Link href="/pipeline">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              ← Về Quy Trình Tuyển Dụng
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sort applications with newest first
  const sortedApps = [...(candidate.applications || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const activeApp = sortedApps.find((a) => a.id === selectedAppId || a.id === id) || sortedApps[0];

  return (
    <div className="space-y-6">
      {/* Top Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <CandidateAvatar
            src={candidate.avatar_url}
            name={candidate.full_name}
            size="xl"
            className="rounded-2xl border-2 border-indigo-200 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{candidate.full_name}</h1>
              {activeApp?.job_title && (
                <Badge variant="info" className="text-xs">
                  {activeApp.job_title}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>📧 {candidate.email}</span>
              {candidate.phone && <span>📞 {candidate.phone}</span>}
              <span>🕒 Đăng ký: {formatDate(candidate.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Link href="/interviews" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              🗓️ Lên Lịch Phỏng Vấn
            </Button>
          </Link>
          <Link href="/pipeline" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              ← Về Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {/* Multiple Applications Switcher (If Candidate applied to multiple jobs) */}
      {sortedApps.length > 1 && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 mr-1">
            Ứng viên đã nộp {sortedApps.length} vị trí tuyển dụng:
          </span>
          {sortedApps.map((app, idx) => {
            const isSelected = activeApp?.id === app.id;
            return (
              <button
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{app.job_title || `Vị trí #${idx + 1}`}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? "bg-indigo-700 text-white" : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {app.match_score ?? 0}% Match
                </span>
                {idx === 0 && <span className="text-[10px] opacity-80">(Mới nhất)</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Grid: AI Match Score & Resume Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Match Score Card */}
        <div className="lg:col-span-2 space-y-6">
          {activeApp && (
            <MatchScoreCard
              scoreBreakdown={activeApp.score_breakdown}
              applicationId={activeApp.id}
              initialFeedback={activeApp.hr_feedback}
              onFeedbackSubmitted={fetchCandidate}
            />
          )}

          {/* Resume Details */}
          <Card>
            <CardHeader
              title="Thông Tin Hồ Sơ Ứng Viên"
              subtitle="Thông tin chuyên môn, quá trình làm việc và kỹ năng được trích xuất từ CV"
            />
            <div className="space-y-4 text-xs">
              {candidate.parsed_data?.skills && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase mb-2">Kỹ năng chuyên môn</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.parsed_data.skills.map((s: string, idx: number) => (
                      <Badge key={idx} variant="info">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {candidate.parsed_data?.experience && (
                <div className="pt-2">
                  <h4 className="font-bold text-slate-700 uppercase mb-2">Kinh nghiệm công tác</h4>
                  <div className="space-y-2">
                    {candidate.parsed_data.experience.map((exp: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="font-semibold text-slate-900 text-sm">
                          {exp.position} - {exp.company}
                        </p>
                        <p className="text-slate-500">{exp.years} năm kinh nghiệm</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Candidate Metadata & Quick Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Thông Tin Bổ Sung" />
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nguồn ứng tuyển:</span>
                <span className="font-semibold text-slate-800">{candidate.source}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Trạng thái hồ sơ:</span>
                <Badge variant="info">{activeApp?.status || "Mới"}</Badge>
              </div>
              {candidate.cv_file_url && (
                <div className="pt-2">
                  <a
                    href={candidate.cv_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold block"
                  >
                    📥 Tải file CV gốc đính kèm
                  </a>
                </div>
              )}
              {candidate.avatar_url && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <CandidateAvatar
                    src={candidate.avatar_url}
                    name={candidate.full_name}
                    size="lg"
                    className="rounded-xl border border-slate-200 shadow-xs"
                  />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ảnh chân dung:</span>
                    <a
                      href={candidate.avatar_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline font-semibold text-xs"
                    >
                      Xem ảnh gốc ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
