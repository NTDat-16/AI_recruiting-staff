"use client";

import React, { useState, useEffect } from "react";
import { Candidate, PipelineStatus } from "@/types";
import { CandidatePipeline } from "@/components/candidate/CandidatePipeline";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [filterJobId, setFilterJobId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload CV form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCandidates = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/candidates", { headers });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/v1/jobs/public");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (data.length > 0) {
          setJobId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  const handleStatusChange = async (
    candidateId: string,
    applicationId: string,
    newStatus: PipelineStatus
  ) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/v1/candidates/applications/${applicationId}/pipeline-status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCandidates();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fullName || !email) return;

    setUploading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("job_id", jobId || (jobs[0]?.id) || "default");
    formData.append("cv_file", file);

    try {
      const res = await fetch("/api/v1/candidates/upload-cv", {
        method: "POST",
        headers,
        body: formData,
      });
      if (res.ok) {
        setIsUploadModalOpen(false);
        fetchCandidates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterJobId === "all") return true;
    return c.applications?.some((a) => a.job_posting_id === filterJobId);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline Quản Lý Ứng Viên</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến trình từ tiếp nhận hồ sơ, sàng lọc, phỏng vấn đến tuyển dụng
          </p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
            + Tải Lên Hồ Sơ Mới
          </Button>
        </div>
      </div>

      {/* Filter by Job selector */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-700">Lọc theo vị trí tuyển dụng:</span>
        <select
          value={filterJobId}
          onChange={(e) => setFilterJobId(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="all">Tất cả vị trí tuyển dụng ({candidates.length} ứng viên)</option>
          {jobs.map((j) => {
            const count = candidates.filter((c) =>
              c.applications?.some((a) => a.job_posting_id === j.id)
            ).length;
            return (
              <option key={j.id} value={j.id}>
                {j.title} ({count} ứng viên)
              </option>
            );
          })}
        </select>
        {filterJobId !== "all" && (
          <button
            onClick={() => setFilterJobId("all")}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer ml-1"
          >
            ✕ Bỏ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Đang tải pipeline ứng viên...</div>
      ) : (
        <CandidatePipeline candidates={filteredCandidates} onStatusChange={handleStatusChange} />
      )}

      {/* Upload CV Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="HR Tải Lên Hồ Sơ Ứng Viên"
      >
        <form onSubmit={handleUploadCV} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vị trí tuyển dụng *</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department || "Engineering"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tệp CV (PDF/DOCX) *</label>
            <input
              type="file"
              required
              accept=".pdf,.docx,.doc"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "AI đang phân tích..." : "Tải lên & Chấm điểm"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
