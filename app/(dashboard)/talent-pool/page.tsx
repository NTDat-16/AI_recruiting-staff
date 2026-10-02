"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Candidate, JobPosting } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { formatDate } from "@/lib/utils/formatters";

export default function TalentPoolPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Rediscovery Modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [rediscovering, setRediscovering] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTalentPool = async (queryText?: string) => {
    setSearching(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res;
      if (queryText && queryText.trim()) {
        res = await fetch("/api/v1/candidates/talent-pool/search", {
          method: "POST",
          headers,
          body: JSON.stringify({ query: queryText.trim(), skills: [] }),
        });
      } else {
        res = await fetch("/api/v1/candidates", { headers });
      }

      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/v1/jobs/public");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTalentPool();
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTalentPool(searchQuery);
  };

  const handleOpenRediscover = (cand: Candidate) => {
    setSelectedCandidate(cand);
  };

  const handleConfirmRediscover = async () => {
    if (!selectedCandidate || !selectedJobId) return;

    setRediscovering(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/candidates/${selectedCandidate.id}/rediscover`, {
        method: "POST",
        headers,
        body: JSON.stringify({ job_id: selectedJobId }),
      });

      if (res.ok) {
        const appData = await res.json();
        const targetJob = jobs.find((j) => j.id === selectedJobId);
        showNotification(
          "success",
          `Đã tái kết nối thành công ứng viên ${selectedCandidate.full_name} vào vị trí "${targetJob?.title || 'mới'}"! Điểm AI Match: ${Math.round(appData.match_score || 80)}%`
        );
        setSelectedCandidate(null);
        fetchTalentPool(searchQuery);
      } else {
        const err = await res.json();
        showNotification("error", err.detail || "Không thể tái kết nối ứng viên.");
      }
    } catch (e: any) {
      showNotification("error", e.message || "Lỗi kết nối.");
    } finally {
      setRediscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho Nhân Tài (Talent Pool & Rediscovery)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị thực thể ứng viên độc lập (Candidate 360), tìm kiếm ngữ nghĩa và tái kết nối (Rediscover) vào vị trí mới
          </p>
        </div>
        <Link href="/candidates">
          <Button variant="outline" size="sm">
            ← Xem Pipeline Tuyển Dụng
          </Button>
        </Link>
      </div>

      {/* Semantic Search Box */}
      <Card className="p-4 bg-white border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm ngữ nghĩa (Ví dụ: Python, FastAPI, Docker, DevOps, 3 năm kinh nghiệm...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={searching}>
              {searching ? "Đang tìm..." : "Tìm Kiếm Ngữ Nghĩa"}
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  fetchTalentPool("");
                }}
              >
                Đặt lại
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">
            Đang tải dữ liệu Talent Pool...
          </div>
        ) : candidates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">
            Không tìm thấy ứng viên phù hợp với tiêu chí tìm kiếm.
          </div>
        ) : (
          candidates.map((cand) => {
            const skills: string[] = cand.parsed_data?.skills || [];
            const appsCount = cand.applications?.length || 0;
            return (
              <Card key={cand.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <CandidateAvatar src={cand.avatar_url} name={cand.full_name} size="lg" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {cand.full_name}
                        </h3>
                        <p className="text-[11px] text-slate-500">📧 {cand.email}</p>
                        {cand.phone && <p className="text-[11px] text-slate-400">📞 {cand.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {skills.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Kỹ năng nổi bật:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 5).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {skills.length > 5 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            +{skills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Applications History Summary */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Lịch sử ứng tuyển:</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                      {appsCount} vị trí
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link href={`/candidates/${cand.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                    Xem Candidate 360 →
                  </Link>

                  <Button
                    size="sm"
                    className="text-xs font-semibold px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    onClick={() => handleOpenRediscover(cand)}
                  >
                    ⚡ Tái Kết Nối (Rediscover)
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Rediscovery Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title="AI Talent Rediscovery: Tái Kết Nối Vào Vị Trí Mới"
        maxWidth="md"
      >
        {selectedCandidate && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-3">
              <CandidateAvatar src={selectedCandidate.avatar_url} name={selectedCandidate.full_name} size="md" />
              <div>
                <p className="font-bold text-sm text-slate-900">{selectedCandidate.full_name}</p>
                <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn vị trí tuyển dụng mới cần kết nối hồ sơ:
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department || "Engineering"})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Quy trình tự động hóa AI:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>Bảo toàn thông tin Candidate Profile gốc.</li>
                <li>Khởi tạo một Job Application mới cho vị trí đã chọn.</li>
                <li>Chạy thuật toán Gemini AI đối sánh CV với tiêu chí JD mới.</li>
                <li>Đưa ứng viên vào Pipeline ở trạng thái Sàng lọc.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)}>
                Hủy
              </Button>
              <Button size="sm" disabled={rediscovering} onClick={handleConfirmRediscover}>
                {rediscovering ? "Đang phân tích AI..." : "Xác nhận Tái Kết Nối"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
