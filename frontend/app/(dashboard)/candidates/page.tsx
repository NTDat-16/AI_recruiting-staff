"use client";

import React, { useState, useEffect } from "react";
import { Candidate, PipelineStatus } from "@/types";
import { CandidatePipeline } from "@/components/candidate/CandidatePipeline";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
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
      const res = await fetch("/api/v1/candidates");
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

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleStatusChange = async (
    candidateId: string,
    applicationId: string,
    newStatus: PipelineStatus
  ) => {
    try {
      await fetch(`/api/v1/candidates/applications/${applicationId}/pipeline-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("job_id", jobId || "default");
    formData.append("cv_file", file);

    try {
      const res = await fetch("/api/v1/candidates/upload-cv", {
        method: "POST",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline Quản Lý Ứng Viên</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến trình từ nộp CV, chấm điểm AI, phỏng vấn đến gửi offer
          </p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
            + HR Tải Lên CV Mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Đang tải pipeline ứng viên...</div>
      ) : (
        <CandidatePipeline candidates={candidates} onStatusChange={handleStatusChange} />
      )}

      {/* Upload CV Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="HR Tải Lên Hồ Sơ Ứng Viên"
      >
        <form onSubmit={handleUploadCV} className="space-y-4">
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
