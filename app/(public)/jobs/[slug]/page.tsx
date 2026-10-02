"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { JobPosting } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/jobs/public/${resolvedParams.slug}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [resolvedParams.slug]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Đang tải thông tin vị trí...</div>;
  }

  if (!job) {
    return (
      <div className="text-center py-12 text-slate-500">
        Không tìm thấy thông tin việc làm yêu cầu.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              {job.department && <span>🏢 {job.department}</span>}
              {job.location && <span>📍 {job.location}</span>}
              {job.salary_range && <span className="font-semibold text-emerald-600">💰 {job.salary_range}</span>}
            </div>
          </div>
          <Link href={`/apply/${job.id}`}>
            <Button size="lg" className="w-full sm:w-auto shadow-md">
              🚀 Nộp Đơn Ứng Tuyển
            </Button>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Mô tả công việc</h3>
            <div className="whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
              {job.description}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Yêu cầu ứng viên</h3>
            <div className="whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
              {job.requirements}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
          <Link href="/jobs/public" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
            ← Quay lại danh sách việc làm
          </Link>
          <Link href={`/apply/${job.id}`}>
            <Button size="md">Ứng tuyển vị trí này</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
