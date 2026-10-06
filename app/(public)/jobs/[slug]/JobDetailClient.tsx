"use client";

import React, { useState } from "react";
import Link from "next/link";
import { JobPosting } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Share2,
  Bookmark,
  Check,
  ArrowLeft,
  Calendar,
  Building2,
  Sparkles,
} from "lucide-react";

interface JobDetailClientProps {
  job: JobPosting;
}

export default function JobDetailClient({ job }: JobDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Tuyển dụng ${job.title} - Lương ${job.salary_range || "Thỏa thuận"} tại AI Talent Suite`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <div>
        <Link
          href="/careers"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Cổng Việc Làm</span>
        </Link>
      </div>

      {/* Main Job Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative subtle background aura */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Full-time
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Đang nhận hồ sơ</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-600">
              {job.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{job.department}</span>
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{job.location}</span>
                </span>
              )}
              {job.salary_range && (
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{job.salary_range}</span>
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Hạn nộp: {new Date(job.deadline).toLocaleDateString("vi-VN")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all hover:border-slate-300"
              title="Chia sẻ cơ hội nghề nghiệp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Đã sao chép link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chia sẻ</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              className={`p-2.5 rounded-xl border transition-all ${
                saved
                  ? "bg-amber-50 border-amber-300 text-amber-600"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              title={saved ? "Đã lưu việc làm" : "Lưu việc làm"}
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <Link href={`/apply/${job.id}`} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ứng tuyển ngay</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Content sections */}
        <div className="mt-8 space-y-8 text-sm text-slate-700 leading-relaxed">
          {/* Mô tả công việc */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Mô tả công việc (Job Description)</span>
            </h2>
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 whitespace-pre-line text-slate-700 leading-relaxed font-sans">
              {job.description || "Chưa có thông tin mô tả chi tiết."}
            </div>
          </section>

          {/* Yêu cầu ứng viên */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Yêu cầu ứng viên (Requirements)</span>
            </h2>
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 whitespace-pre-line text-slate-700 leading-relaxed font-sans">
              {job.requirements || "Theo tiêu chuẩn chuyên môn vị trí."}
            </div>
          </section>

          {/* Quyền lợi đãi ngộ */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Quyền lợi & Đãi ngộ (Benefits)</span>
            </h2>
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/80 text-slate-700 space-y-2 text-xs leading-relaxed">
              <p>• <strong>Thu nhập cạnh tranh:</strong> Review lương định kỳ 2 lần/năm, thưởng tháng 13 và thưởng hiệu quả dự án.</p>
              <p>• <strong>Chăm sóc sức khỏe:</strong> Gói bảo hiểm sức khỏe cao cấp cho nhân viên và người thân.</p>
              <p>• <strong>Môi trường làm việc:</strong> Trang bị Macbook Pro / máy trạm cấu hình cao, hỗ trợ làm việc Hybrid linh hoạt.</p>
              <p>• <strong>Đào tạo & Phát triển:</strong> Ngân sách học tập chứng chỉ quốc tế (AWS, GCP, Scrum) và tham gia hội thảo công nghệ.</p>
            </div>
          </section>
        </div>

        {/* Footer CTA Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold">Sẵn sàng gia nhập đội ngũ chúng tôi?</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Quy trình Quick Apply chỉ mất 30 giây, không bắt buộc tạo tài khoản.
            </p>
          </div>
          <Link href={`/apply/${job.id}`} className="shrink-0 w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-xs"
            >
              Nộp Đơn Ứng Tuyển →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
