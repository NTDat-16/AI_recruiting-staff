"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  MoreVertical,
  Search,
  RotateCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface JobPostingItem {
  id: string;
  code: string;
  title: string;
  type: "Hybrid" | "Full-time" | "Remote";
  location: string;
  techStack: string;
  department: string;
  targetCount: number;
  applicantsCount: number;
  salaryRange: string;
  recruiterName: string;
  deadline: string;
  status: "published" | "draft" | "closed";
}

export default function JobsDashboardPage() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDepartment, setFormDepartment] = useState("Product Development");
  const [formType, setFormType] = useState<"Hybrid" | "Full-time" | "Remote">("Hybrid");
  const [formLocation, setFormLocation] = useState("Hồ Chí Minh");
  const [formStack, setFormStack] = useState("");
  const [formQuota, setFormQuota] = useState(2);
  const [formSalary, setFormSalary] = useState("35.000.000 - 50.000.000 VNĐ");
  const [formDeadline, setFormDeadline] = useState("2026-12-31");
  const [formRecruiter, setFormRecruiter] = useState("Nguyễn Thu Trang");
  const [formDescription, setFormDescription] = useState("");
  const [formRequirements, setFormRequirements] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  // Load real jobs from Database
  useEffect(() => {
    const fetchApiJobs = async () => {
      setLoading(true);
      try {
        let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        let apiData: any[] = [];

        // Try authenticated jobs endpoint first if token exists
        if (token) {
          try {
            const res = await fetch("/api/v1/jobs", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              apiData = await res.json();
            }
          } catch {}
        }

        // Fallback or public endpoint to ensure all public jobs in DB are displayed
        if (!apiData || apiData.length === 0) {
          const pubRes = await fetch("/api/v1/jobs/public");
          if (pubRes.ok) {
            apiData = await pubRes.json();
          }
        }

        if (Array.isArray(apiData) && apiData.length > 0) {
          const mapped: JobPostingItem[] = apiData.map((j: any, idx: number) => ({
            id: j.id || String(idx),
            code: `JOB-${j.title?.slice(0, 3).toUpperCase() || "TECH"}-${String(idx + 1).padStart(2, "0")}`,
            title: j.title || "Software Engineer",
            type: j.location?.toLowerCase().includes("remote")
              ? "Remote"
              : j.location?.toLowerCase().includes("hybrid")
              ? "Hybrid"
              : "Full-time",
            location: j.location || "Hồ Chí Minh",
            techStack: j.requirements?.slice(0, 45) || ".NET, React, SQL",
            department: j.department || "Khối Công nghệ & Sản phẩm",
            targetCount: j.target_hires || 2,
            applicantsCount: j.applications_count ?? 4,
            salaryRange: j.salary_range || "30.000.000 - 50.000.000 VNĐ",
            recruiterName: "Phòng Nhân sự (HR)",
            deadline: j.deadline?.slice(0, 10) || "2026-12-31",
            status: j.status === "closed" ? "closed" : j.status === "draft" ? "draft" : "published",
          }));
          setJobs(mapped);
        }
      } catch (e) {
        console.error("Error loading jobs from DB:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchApiJobs();
  }, []);

  const handleGenerateAI_JD = async () => {
    if (!formTitle) return;
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/v1/candidates/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Viết nhanh mô tả công việc (JD) và yêu cầu ứng viên chuẩn ATS cho vị trí: ${formTitle}, stack: ${formStack}, địa điểm: ${formLocation}. Ngắn gọn 3 gạch đầu dòng mỗi phần.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.reply || "";
        setFormDescription(text);
        setFormRequirements(
          `- Có từ 3+ năm kinh nghiệm vững vàng với ${formStack || "công nghệ yêu cầu"}.\n- Tư duy giải quyết vấn đề tốt, kỹ năng giao tiếp và làm việc nhóm hiệu quả.\n- Tốt nghiệp ĐH chuyên ngành CNTT hoặc tương đương.`
        );
      } else {
        setFormDescription(
          `- Tham gia thiết kế kiến trúc hệ thống và phát triển các module tính năng lõi.\n- Tối ưu hóa hiệu năng, xử lý tải cao và bảo mật dữ liệu.\n- Phối hợp chặt chẽ cùng Product Owner và UI/UX Designer.`
        );
        setFormRequirements(
          `- Có từ 3-5 năm kinh nghiệm thực chiến với ${formStack || ".NET / React"}.\n- Thành thạo CI/CD, Docker, Microservices và Clean Architecture.\n- Kỹ năng làm việc độc lập và tiếng Anh đọc hiểu tài liệu tốt.`
        );
      }
    } catch {
      setFormDescription(
        `- Xây dựng và mở rộng hệ thống phần mềm hiệu năng cao.\n- Viết mã nguồn sạch, unit test và tài liệu kỹ thuật chuẩn mực.`
      );
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: JobPostingItem = {
      id: String(Date.now()),
      code: `JOB-${formTitle.slice(0, 3).toUpperCase()}-0${jobs.length + 1}`,
      title: formTitle,
      type: formType,
      location: formLocation,
      techStack: formStack || "Tech Stack",
      department: formDepartment,
      targetCount: formQuota,
      applicantsCount: 0,
      salaryRange: formSalary,
      recruiterName: formRecruiter,
      deadline: formDeadline,
      status: "published",
    };
    setJobs([newJob, ...jobs]);
    setIsModalOpen(false);
    setFormTitle("");
  };

  // Filter
  const filteredJobs = jobs.filter((j) => {
    if (activeTab === "published" && j.status !== "published") return false;
    if (activeTab === "draft" && j.status !== "draft") return false;
    if (activeTab === "closed" && j.status !== "closed") return false;

    if (departmentFilter !== "all" && j.department !== departmentFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = j.code.toLowerCase().includes(q);
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchStack = j.techStack.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchStack) return false;
    }

    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, departmentFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredJobs.length);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedJobs.length && paginatedJobs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedJobs.map((j) => j.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Tin tuyển dụng & JD (Jobs & Publishing)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý đợt tuyển, AI sinh JD chuẩn, rà soát lỗi & đăng tuyển đa kênh
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => alert("Nhập hàng loạt tin tuyển dụng từ Excel")}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập từ Excel</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>

          <button className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 no-scrollbar max-w-full">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "all"
              ? "bg-sky-50 text-blue-600 border border-sky-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Tất cả <span className="ml-1 text-[11px] font-bold">{jobs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("published")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "published"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Đang tuyển (Published){" "}
          <span className="ml-1 text-[11px]">
            {jobs.filter((j) => j.status === "published").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("draft")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "draft"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Bản nháp (Draft){" "}
          <span className="ml-1 text-[11px]">
            {jobs.filter((j) => j.status === "draft").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("closed")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "closed"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Đã đóng (Closed){" "}
          <span className="ml-1 text-[11px]">
            {jobs.filter((j) => j.status === "closed").length}
          </span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã tin, chức danh, công nghệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 pl-0 md:pl-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="whitespace-nowrap">Phòng ban:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Product Development">Product Development</option>
              <option value="AI Innovation Hub">AI Innovation Hub</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery("");
              setDepartmentFilter("all");
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            title="Làm mới bộ lọc"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            title="Bộ lọc nâng cao"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedJobs.length && paginatedJobs.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">Mã tin</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Vị trí tuyển dụng</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Phòng ban</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Chỉ tiêu</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Ứng viên</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Khoảng lương</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Recruiter</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Đang tải danh sách tin tuyển dụng từ cơ sở dữ liệu...</span>
                  </td>
                </tr>
              ) : paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Chưa có tin tuyển dụng nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-600 cursor-pointer hover:underline whitespace-nowrap">
                      {job.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{job.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                          {job.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {job.location} • <span className="text-slate-600">Stack: {job.techStack}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                      {job.department}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                      {job.targetCount}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        href={`/pipeline`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        {job.applicantsCount} HS
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                      {job.salaryRange}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{job.recruiterName}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Hạn: {job.deadline}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang tuyển
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Tổng số: <strong className="text-slate-800">{filteredJobs.length}</strong> tin tuyển dụng
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span>Số dòng/trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 bg-white font-medium focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <span className="font-medium text-slate-700">
              {filteredJobs.length === 0
                ? "0 – 0"
                : `${startIndex + 1} – ${endIndex}`}{" "}
              / {filteredJobs.length}
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className={`p-1 rounded transition-colors ${
                  currentPage <= 1
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-100 cursor-pointer"
                }`}
                title="Trang đầu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`p-1 rounded transition-colors ${
                  currentPage <= 1
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-100 cursor-pointer"
                }`}
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`p-1 rounded transition-colors ${
                  currentPage >= totalPages
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-100 cursor-pointer"
                }`}
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className={`p-1 rounded transition-colors ${
                  currentPage >= totalPages
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-100 cursor-pointer"
                }`}
                title="Trang cuối"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Tạo tin tuyển mới & AI JD Copilot */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Tin Tuyển Dụng Mới (Jobs & Publishing)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Chức danh công việc *</label>
              <button
                type="button"
                onClick={handleGenerateAI_JD}
                disabled={generatingAI || !formTitle}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-40"
              >
                {generatingAI ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>AI Sinh JD Chuẩn</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="VD: Senior Backend Developer (.NET)"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng ban</label>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Product Development">Product Development</option>
                <option value="AI Innovation Hub">AI Innovation Hub</option>
                <option value="Infra/Cloud">Infra/Cloud</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hình thức làm việc</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Full-time">Full-time</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Công nghệ chính (Stack)</label>
              <input
                type="text"
                placeholder="VD: .NET 8, C#, Apache Kafka"
                value={formStack}
                onChange={(e) => setFormStack(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khoảng lương</label>
              <input
                type="text"
                value={formSalary}
                onChange={(e) => setFormSalary(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chỉ tiêu (Người)</label>
              <input
                type="number"
                min="1"
                value={formQuota}
                onChange={(e) => setFormQuota(parseInt(e.target.value) || 1)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hạn nộp hồ sơ</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recruiter phụ trách</label>
              <input
                type="text"
                value={formRecruiter}
                onChange={(e) => setFormRecruiter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả công việc (JD)</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Nhiệm vụ chính, trách nhiệm hàng ngày..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Yêu cầu ứng viên</label>
            <textarea
              rows={3}
              value={formRequirements}
              onChange={(e) => setFormRequirements(e.target.value)}
              placeholder="Kinh nghiệm, kỹ năng bắt buộc..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Đăng tin tuyển dụng</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
