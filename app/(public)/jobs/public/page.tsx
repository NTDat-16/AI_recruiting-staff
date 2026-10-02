"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { JobPosting } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PublicJobBoardPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/jobs/public")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="text-center py-8 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight">Cơ Hội Nghề Nghiệp</h1>
        <p className="text-indigo-200 mt-2 text-sm max-w-xl mx-auto">
          Khám phá các vị trí tuyển dụng hấp dẫn, nộp CV trực tiếp và nhận phản hồi nhanh chóng từ hệ thống tuyển dụng thông minh.
        </p>
      </div>

      {/* Job list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải danh sách việc làm...</div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-12 text-slate-500">
            Hiện tại chưa có vị trí nào đang tuyển dụng. Vui lòng quay lại sau!
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="p-6 hover:shadow-md transition-shadow border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-indigo-600">
                    <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                    {job.department && <span>🏢 {job.department}</span>}
                    {job.location && <span>📍 {job.location}</span>}
                    {job.salary_range && <span className="font-semibold text-emerald-600">💰 {job.salary_range}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <Link href={`/jobs/${job.slug}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full">
                      Xem chi tiết
                    </Button>
                  </Link>
                  <Link href={`/apply/${job.id}`} className="flex-1 sm:flex-none">
                    <Button size="sm" className="w-full">
                      Ứng tuyển ngay
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
