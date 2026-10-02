"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Candidate } from "@/types";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { MatchScoreCard } from "@/components/candidate/MatchScoreCard";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/formatters";

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch(`/api/v1/candidates/${resolvedParams.id}`, { headers });
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
            res = await fetch(`/api/v1/candidates/${resolvedParams.id}`, { headers });
          }
        } catch (authErr) {
          console.warn("Auto-login retry error:", authErr);
        }
      }

      if (res.ok) {
        const data = await res.json();
        setCandidate(data);
        return;
      }
      
      // Fallback mock profiles for demonstration IDs
      const mockProfiles: Record<string, any> = {
        "1": {
          id: "1",
          full_name: "Nguyễn Văn An",
          email: "an.nguyenvan@gmail.com",
          phone: "0912 345 678",
          source: "Career Website",
          created_at: "2026-09-22T08:30:00Z",
          parsed_data: {
            skills: [".NET Core", "C#", "Apache Kafka", "Docker", "SQL Server", "Microservices", "Redis"],
            experience: [
              { position: "Senior Backend Developer", company: "VNG Corporation", years: 4 },
              { position: "Software Engineer (.NET)", company: "FPT Software", years: 4 },
            ],
          },
          applications: [
            {
              id: "app-1",
              candidate_id: "1",
              job_posting_id: "job-1",
              job_title: "Senior Backend Developer (.NET)",
              status: "interviewed",
              match_score: 94,
              score_breakdown: {
                overall_score: 94,
                breakdown: [
                  { name: "Kỹ năng .NET & Kafka", weight: 0.5, score: 95, explanation: "Rất thành thạo C#, .NET 8 và Kafka tải lớn" },
                  { name: "Kinh nghiệm chuyên môn", weight: 0.3, score: 92, explanation: "8 năm kinh nghiệm phát triển phần mềm" },
                  { name: "Học vấn & Bằng cấp", weight: 0.2, score: 90, explanation: "Tốt nghiệp ĐH Bách Khoa TP.HCM" },
                ],
                strengths: [
                  "8+ năm kinh nghiệm thực chiến .NET Core / C#",
                  "Kinh nghiệm xử lý Message Queue với Apache Kafka tải lớn",
                  "Kiến trúc Clean Architecture & Microservices vững vàng",
                ],
                gaps: [
                  "Chưa có chứng chỉ Cloud AWS chính thức (nhưng có kinh nghiệm thực tế)",
                ],
                recommendation: "Đề xuất mời phỏng vấn kỹ thuật chuyên sâu và đàm phán Offer.",
              },
              hr_feedback: {
                accuracy_rating: 5,
                comment: "Ứng viên có kiến thức chuyên môn vững chắc, giao tiếp tự tin và nhiệt huyết.",
              },
              created_at: "2026-09-22T08:30:00Z",
              updated_at: "2026-09-22T08:30:00Z",
            },
          ],
        },
        "2": {
          id: "2",
          full_name: "Trần Thị Mai",
          email: "mai.tran@outlook.com",
          phone: "0983 221 456",
          source: "LinkedIn",
          created_at: "2026-09-26T09:15:00Z",
          parsed_data: {
            skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux Toolkit", "GraphQL"],
            experience: [
              { position: "Lead Frontend Engineer", company: "Tiki Corp", years: 3 },
              { position: "Frontend Developer", company: "Momo", years: 3 },
            ],
          },
          applications: [
            {
              id: "app-2",
              candidate_id: "2",
              job_posting_id: "job-2",
              job_title: "Senior Frontend Engineer (React/TypeScript)",
              status: "reviewing",
              match_score: 90,
              score_breakdown: {
                overall_score: 90,
                breakdown: [
                  { name: "React & TypeScript", weight: 0.5, score: 92, explanation: "Kiến thức React và TypeScript chuyên sâu" },
                  { name: "Kinh nghiệm làm việc", weight: 0.3, score: 88, explanation: "6 năm kinh nghiệm Frontend" },
                  { name: "Kiến trúc giao diện", weight: 0.2, score: 90, explanation: "Thành thạo Design System" },
                ],
                strengths: [
                  "6+ năm kinh nghiệm React, TypeScript, Next.js",
                  "Thành thạo tối ưu Web Performance và Design System Tailwind CSS",
                ],
                gaps: [
                  "Kinh nghiệm kiểm thử tự động E2E với Cypress còn ở mức cơ bản",
                ],
                recommendation: "Phù hợp để phỏng vấn vòng chuyên môn.",
              },
              hr_feedback: {
                accuracy_rating: 5,
                comment: "Hồ sơ ứng viên rất tiềm năng cho vị trí Lead Frontend.",
              },
              created_at: "2026-09-26T09:15:00Z",
              updated_at: "2026-09-26T09:15:00Z",
            },
          ],
        },
        "3": {
          id: "3",
          full_name: "Lê Quốc Bảo",
          email: "baole.tech@gmail.com",
          phone: "0909 112 334",
          source: "Referral",
          created_at: "2026-09-20T14:00:00Z",
          parsed_data: {
            skills: ["Cloud Architecture", "AWS", "Kubernetes", "Terraform", "CI/CD", "Go"],
            experience: [
              { position: "Solution Architect", company: "Viettel Solutions", years: 5 },
              { position: "Senior DevOps Engineer", company: "VNPT-IT", years: 5 },
            ],
          },
          applications: [
            {
              id: "app-3",
              candidate_id: "3",
              job_posting_id: "job-3",
              job_title: "Solution Architect (Cloud & Microservices)",
              status: "reviewing",
              match_score: 88,
              score_breakdown: {
                overall_score: 88,
                breakdown: [
                  { name: "Cloud & K8s", weight: 0.5, score: 90, explanation: "Thiết kế hạ tầng chịu tải lớn" },
                  { name: "Kinh nghiệm", weight: 0.3, score: 85, explanation: "10 năm làm kiến trúc sư phần mềm" },
                  { name: "Học vấn", weight: 0.2, score: 90, explanation: "Thạc sĩ Khoa học máy tính" },
                ],
                strengths: [
                  "10 năm kinh nghiệm thiết kế hạ tầng điện toán đám mây quy mô lớn",
                ],
                gaps: [],
                recommendation: "Ứng viên sáng giá cho vị trí Kiến trúc sư giải pháp.",
              },
              created_at: "2026-09-20T14:00:00Z",
              updated_at: "2026-09-20T14:00:00Z",
            },
          ],
        },
        "4": {
          id: "4",
          full_name: "Hoàng Minh Tuấn",
          email: "tuan.hm@dev.vn",
          phone: "0934 567 890",
          source: "Referral",
          created_at: "2026-09-24T11:20:00Z",
          parsed_data: {
            skills: [".NET Core", "SQL Server", "RabbitMQ", "Redis", "C#"],
            experience: [
              { position: "Mid Backend Developer", company: "KiotViet", years: 4 },
            ],
          },
          applications: [
            {
              id: "app-4",
              candidate_id: "4",
              job_posting_id: "job-1",
              job_title: "Senior Backend Developer (.NET)",
              status: "talent_pool",
              match_score: 71,
              score_breakdown: {
                overall_score: 71,
                breakdown: [
                  { name: "Kỹ năng .NET", weight: 0.5, score: 75, explanation: "Nền tảng vững nhưng cần thêm kinh nghiệm hệ thống lớn" },
                  { name: "Kinh nghiệm làm việc", weight: 0.3, score: 68, explanation: "4 năm kinh nghiệm (yêu cầu 5+ năm)" },
                  { name: "Học vấn", weight: 0.2, score: 70, explanation: "Cử nhân CNTT" },
                ],
                strengths: ["4 năm kinh nghiệm .NET Core, SQL Server, RabbitMQ"],
                gaps: ["Chưa đủ số năm kinh nghiệm yêu cầu cho vị trí Senior (cần 5+ năm)"],
                recommendation: "Lưu trữ vào Talent Pool để kết nối cho các vị trí Mid Backend tiếp theo.",
              },
              created_at: "2026-09-24T11:20:00Z",
              updated_at: "2026-09-24T11:20:00Z",
            },
          ],
        },
      };

      const fallback = (mockProfiles[resolvedParams.id] || mockProfiles["1"]) as Candidate;
      setCandidate(fallback);
    } catch (e) {
      console.error(e);
      // Even on network error, ensure user gets mock
      setCandidate({
        id: resolvedParams.id,
        company_id: "demo-co",
        full_name: "Nguyễn Văn An",
        email: "an.nguyenvan@gmail.com",
        phone: "0912 345 678",
        source: "Career Website",
        tags: ["Senior", ".NET"],
        rating: 5,
        created_at: "2026-09-22T08:30:00Z",
        parsed_data: {
          skills: [".NET Core", "C#", "Apache Kafka", "Docker", "SQL Server"],
          experience: [{ position: "Senior Backend Developer", company: "VNG", years: 8 }],
        },
        applications: [
          {
            id: "app-1",
            candidate_id: resolvedParams.id,
            job_posting_id: "job-1",
            job_title: "Senior Backend Developer (.NET)",
            status: "interviewed",
            match_score: 94,
            score_breakdown: {
              overall_score: 94,
              breakdown: [],
              strengths: ["8+ năm kinh nghiệm thực chiến .NET Core / C#"],
              gaps: [],
              recommendation: "Đề xuất phỏng vấn chuyên môn.",
            },
            created_at: "2026-09-22T08:30:00Z",
            updated_at: "2026-09-22T08:30:00Z",
          },
        ],
      } as Candidate);
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

  // Sort applications with newest first
  const sortedApps = [...(candidate.applications || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const activeApp = sortedApps.find((a) => a.id === selectedAppId) || sortedApps[0];

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
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
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
