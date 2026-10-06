"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ApplyFormClientProps {
  jobId: string;
}

export function ApplyFormClient({ jobId }: ApplyFormClientProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // 1. Kiểm tra dung lượng tối đa 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError("Dung lượng tệp vượt quá giới hạn 15MB. Vui lòng nén hoặc chọn tệp nhỏ hơn.");
      setFile(null);
      return;
    }

    // 2. Kiểm tra định dạng (.pdf, .docx, .doc)
    const allowedExtensions = [".pdf", ".docx", ".doc"];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setError("Định dạng tệp không hợp lệ. Vui lòng chỉ tải lên tệp định dạng .PDF hoặc .DOCX.");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Vui lòng điền đầy đủ Họ tên và Email liên hệ");
      return;
    }

    if (!file) {
      setError("Vui lòng đính kèm tệp CV (định dạng PDF hoặc DOCX)");
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("job_id", jobId);
    formData.append("full_name", fullName.trim());
    formData.append("email", email.trim());
    if (phone.trim()) formData.append("phone", phone.trim());
    formData.append("cv_file", file);

    try {
      const res = await fetch("/api/v1/candidates/apply", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại sau.");
      }

      const data = await res.json();
      setSuccessData({
        id: data.id || "APP-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        email: email.trim(),
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const trackingCode = successData
    ? `TRK-${successData.id.slice(0, 8).toUpperCase()}`
    : "";

  const handleCopyCode = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Ứng Tuyển Cơ Hội Nghề Nghiệp"
          subtitle="Vui lòng hoàn tất thông tin và đính kèm CV định dạng PDF hoặc DOCX"
        />

        {successData ? (
          <div className="text-center py-8 px-2 sm:px-6 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Nộp Hồ Sơ Thành Công!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Cảm ơn bạn đã nộp hồ sơ ứng tuyển. Hệ thống AI ATS đã tiếp nhận CV và chuyển đến Hội đồng Tuyển dụng.
            </p>

            {/* Mã tra cứu an toàn */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Mã tra cứu tiến độ ứng tuyển (Tracking Code)
              </span>
              <div className="flex items-center justify-between bg-white border border-slate-300 rounded-xl px-4 py-2.5">
                <span className="font-mono text-base font-extrabold text-indigo-700 tracking-wider">
                  {trackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  {copied ? "✓ Đã sao chép" : "Sao chép mã"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Hãy lưu lại mã này hoặc kiểm tra hộp thư <strong>{successData.email}</strong> để tra cứu tiến độ hồ sơ bất kỳ lúc nào.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/careers/track?email=${encodeURIComponent(successData.email)}&code=${encodeURIComponent(successData.id)}`}
              >
                <Button className="w-full sm:w-auto px-6 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  🔍 Tra cứu tiến độ ngay
                </Button>
              </Link>
              <Link href="/careers">
                <Button variant="outline" className="w-full sm:w-auto">
                  ← Xem các vị trí khác
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
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
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
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
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đính kèm tệp CV (PDF / DOCX) <span className="text-rose-500">*</span>
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? "border-indigo-500 bg-indigo-50/30"
                    : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  required={!file}
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  id="cv-upload-input"
                />
                <label htmlFor="cv-upload-input" className="cursor-pointer block">
                  <span className="text-3xl block mb-2">{file ? "📄" : "📁"}</span>
                  <span className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                    {file ? file.name : "Nhấp để chọn file hoặc kéo thả tệp CV vào đây"}
                  </span>
                  {file && (
                    <p className="text-xs text-slate-500 mt-1">
                      Dung lượng: {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Hỗ trợ định dạng .PDF, .DOCX (tối đa 15MB, đã kích hoạt bảo vệ chống spam)
                  </p>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Link href="/careers" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                ← Quay lại Cổng Tuyển Dụng
              </Link>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
                {submitting ? "Đang xử lý & phân tích AI ATS..." : "Xác Nhận Nộp Hồ Sơ"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
