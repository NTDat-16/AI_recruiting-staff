"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ApplyJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const resolvedParams = use(params);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setError("Vui lòng điền đầy đủ Họ tên và Email");
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("job_id", resolvedParams.jobId);
    formData.append("full_name", fullName);
    formData.append("email", email);
    if (phone) formData.append("phone", phone);
    if (file) formData.append("cv_file", file);

    try {
      const apiEndpoint = "/api/v1/candidates/apply";

      const res = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Có lỗi xảy ra khi nộp hồ sơ");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Ứng Tuyển Cơ Hội Nghề Nghiệp"
          subtitle="Tải lên CV của bạn định dạng PDF hoặc DOCX để hệ thống AI phân tích và phản hồi"
        />

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-slate-900">Nộp Hồ Sơ Thành Công!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Cảm ơn bạn đã ứng tuyển. Hệ thống đã tiếp nhận CV và bắt đầu quá trình sàng lọc tự động. Bộ phận tuyển dụng sẽ sớm liên hệ qua email <strong>{email}</strong>.
            </p>
            <div className="pt-4">
              <Link href="/jobs/public">
                <Button variant="outline" size="sm">
                  ← Xem các vị trí khác
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đính kèm tệp CV (PDF / DOCX) <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="cv-upload-input"
                />
                <label htmlFor="cv-upload-input" className="cursor-pointer">
                  <span className="text-3xl block mb-2">📄</span>
                  <span className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                    {file ? file.name : "Nhấp để chọn file hoặc kéo thả tệp vào đây"}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">Hỗ trợ tệp định dạng .PDF, .DOCX (tối đa 15MB)</p>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Link href="/jobs/public" className="text-xs text-slate-500 hover:text-slate-800">
                Hủy bỏ
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang xử lý & phân tích AI..." : "Xác Nhận Nộp Hồ Sơ"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
