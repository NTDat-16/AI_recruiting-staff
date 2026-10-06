"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { JobPosting } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CareerChatWidget } from "@/components/candidate/CareerChatWidget";
import {
  Search,
  MapPin,
  Building2,
  DollarSign,
  Briefcase,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface CareerJobListClientProps {
  initialJobs: JobPosting[];
}

export default function CareerJobListClient({ initialJobs }: CareerJobListClientProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Extract unique departments and locations
  const departments = useMemo(() => {
    const set = new Set<string>();
    initialJobs.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return Array.from(set);
  }, [initialJobs]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    initialJobs.forEach((j) => {
      if (j.location) set.add(j.location);
    });
    return Array.from(set);
  }, [initialJobs]);

  // Client-side filtering over ISR cached data
  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      const matchKeyword =
        !searchKeyword.trim() ||
        job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.requirements?.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchDept = selectedDept === "all" || job.department === selectedDept;
      const matchLocation = selectedLocation === "all" || job.location === selectedLocation;

      return matchKeyword && matchDept && matchLocation;
    });
  }, [initialJobs, searchKeyword, selectedDept, selectedLocation]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header Hero Banner */}
      <div className="text-center py-12 px-6 sm:px-12 bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-950 text-white rounded-3xl shadow-md relative overflow-hidden">
        {/* Subtle decorative aura */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nền tảng Tuyển dụng Thông minh ATS Core</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Khám Phá Cơ Hội Nghề Nghiệp Đột Phá
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
            Ứng tuyển siêu tốc với quy trình <strong>Quick Apply (30 giây)</strong> không cần tạo tài khoản.
            Hệ thống AI tự động phân tích độ phù hợp và phản hồi trong 24 giờ!
          </p>
        </div>
      </div>

      {/* Interactive Filter Bar (Client Island - Không làm mất tính năng ISR của trang chính) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo chức danh, kỹ năng (Python, AI, React, Cloud)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">🏢 Tất cả phòng ban</option>
              {departments.map((d, i) => (
                <option key={i} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">📍 Tất cả địa điểm</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Tìm thấy <strong>{filteredJobs.length}</strong> vị trí tuyển dụng phù hợp
          </span>
          <Link
            href="/careers/track"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
          >
            Đã nộp đơn? Tra cứu kết quả xét duyệt →
          </Link>
        </div>
      </div>

      {/* Job List Container */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card className="text-center py-16 text-slate-500 p-6 bg-white border-dashed rounded-2xl">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy vị trí phù hợp với tiêu chí lọc của bạn.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Hãy thử bỏ bớt từ khóa hoặc chọn "Tất cả phòng ban".
            </p>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Mới mở
                  </span>
                  {job.department && (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{job.department}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                  {job.location && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{job.location}</span>
                    </span>
                  )}
                  {job.salary_range && (
                    <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{job.salary_range}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <Link href={`/jobs/${job.slug}`} className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold rounded-xl border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  >
                    Chi tiết JD
                  </Button>
                </Link>
                <Link href={`/apply/${job.id}`} className="flex-1 sm:flex-none">
                  <Button
                    size="sm"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <span>Ứng tuyển</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating AI Chatbot Widget */}
      <CareerChatWidget />
    </div>
  );
}
