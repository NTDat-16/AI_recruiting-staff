"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Candidate } from "@/types";
import { MatchScoreCard } from "@/components/candidate/MatchScoreCard";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/formatters";

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    try {
      const res = await fetch(`/api/v1/candidates/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setCandidate(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Đang tải hồ sơ ứng viên...</div>;
  }

  if (!candidate) {
    return <div className="text-center py-12 text-slate-500">Không tìm thấy ứng viên.</div>;
  }

  const latestApp = candidate.applications?.[0];

  return (
    <div className="space-y-6">
      {/* Top Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
            {candidate.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{candidate.full_name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>📧 {candidate.email}</span>
              {candidate.phone && <span>📞 {candidate.phone}</span>}
              <span>🕒 Ứng tuyển: {formatDate(candidate.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Link href="/interviews" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full">
              🗓️ Lên Lịch Phỏng Vấn
            </Button>
          </Link>
          <Link href="/candidates" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              ← Trở Về Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: AI Match Score & Resume Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Match Score Card */}
        <div className="lg:col-span-2 space-y-6">
          {latestApp && (
            <MatchScoreCard
              scoreBreakdown={latestApp.score_breakdown}
              applicationId={latestApp.id}
              initialFeedback={latestApp.hr_feedback}
              onFeedbackSubmitted={fetchCandidate}
            />
          )}

          {/* Parsed Resume Details */}
          <Card>
            <CardHeader
              title="Dữ Liệu Trích Xuất Tự Động Từ CV (Parsed Data)"
              subtitle="Trích xuất cấu trúc hóa thông tin học vấn, kinh nghiệm và kỹ năng bằng AI"
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
                        <p className="font-semibold text-slate-900 text-sm">{exp.position} - {exp.company}</p>
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
                <Badge variant="info">{latestApp?.status || "Mới"}</Badge>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
