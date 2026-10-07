"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  MoreVertical,
  Search,
  ChevronDown,
  RotateCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  FileEdit,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface RecruitmentRequest {
  id: string;
  code: string;
  title: string;
  level: string;
  location: string;
  department: string;
  quantity: number;
  salaryRange: string;
  proposerName: string;
  proposerRole: string;
  proposedDate: string;
  status: "approved" | "pending" | "draft";
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Request Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDepartment, setFormDepartment] = useState("Phát triển Sản phẩm (Product)");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formSalary, setFormSalary] = useState("30.000.000 đ - 45.000.000 đ");
  const [formLocation, setFormLocation] = useState("Hồ Chí Minh");
  const [formLevel, setFormLevel] = useState("Level: Senior");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/jobs/public");
      if (res.ok) {
        const jobs = await res.json();
        if (Array.isArray(jobs)) {
          const mapped: RecruitmentRequest[] = jobs.map((job: any, idx: number) => {
            const title = job.title || "Vị trí tuyển dụng";
            const level = title.includes("Senior")
              ? "Level: Senior"
              : title.includes("Lead") || title.includes("Architect")
              ? "Level: Lead / Architect"
              : "Level: Mid-Level";
            const status: "approved" | "pending" | "draft" =
              idx % 3 === 0 ? "approved" : idx % 3 === 1 ? "pending" : "approved";

            return {
              id: job.id || String(idx + 1),
              code: `YCT-2026-${String(idx + 1).padStart(3, "0")}`,
              title: title,
              level: level,
              location: job.location || "Hồ Chí Minh",
              department: job.department || "Khối Công nghệ & Sản phẩm",
              quantity: 2,
              salaryRange: job.salary_range || "30.000.000 đ - 50.000.000 đ",
              proposerName: "Phòng Kỹ thuật & Công nghệ",
              proposerRole: "Engineering Manager",
              proposedDate: "2026-10-01",
              status: status,
            };
          });
          setRequests(mapped);
        }
      }
    } catch (err) {
      console.error("Error loading requests from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (activeTab === "pending" && r.status !== "pending") return false;
    if (activeTab === "approved" && r.status !== "approved") return false;
    if (activeTab === "draft" && r.status !== "draft") return false;

    if (departmentFilter !== "all" && r.department !== departmentFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = r.code.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchProposer = r.proposerName.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchProposer) return false;
    }

    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, departmentFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRequests.length);
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRequests.length && paginatedRequests.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRequests.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: RecruitmentRequest = {
      id: String(Date.now()),
      code: `YCT-2026-09${requests.length + 1}`,
      title: formTitle,
      level: formLevel,
      location: formLocation,
      department: formDepartment,
      quantity: formQuantity,
      salaryRange: formSalary,
      proposerName: "Nguyễn Thu Trang",
      proposerRole: "Recruitment Lead",
      proposedDate: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setRequests([newReq, ...requests]);
    setIsModalOpen(false);
    setFormTitle("");
  };

  const renderStatusBadge = (status: RecruitmentRequest["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã phê duyệt
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Chờ duyệt
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Yêu cầu tuyển dụng (Recruitment Requests)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý nhu cầu bổ sung headcount & quy trình phê duyệt đa cấp
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => alert("Tính năng nhập dữ liệu hàng loạt từ tệp Excel chuẩn ATS")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập từ Excel</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>

          <button className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === "all"
              ? "bg-sky-50 text-blue-600 border border-sky-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Tất cả <span className="ml-1 text-[11px] font-bold">{requests.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "pending"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Chờ duyệt{" "}
          <span className="ml-1 text-[11px]">
            {requests.filter((r) => r.status === "pending").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "approved"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Đã duyệt{" "}
          <span className="ml-1 text-[11px]">
            {requests.filter((r) => r.status === "approved").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("draft")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "draft"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Bản nháp{" "}
          <span className="ml-1 text-[11px]">
            {requests.filter((r) => r.status === "draft").length}
          </span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã yêu cầu, vị trí, người đề xuất..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Department Dropdown + Action Icons */}
        <div className="flex items-center space-x-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 pl-0 md:pl-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="whitespace-nowrap">Phòng ban:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Phát triển Sản phẩm (Product)">Phát triển Sản phẩm (Product)</option>
              <option value="Khối Công nghệ & Hạ tầng">Khối Công nghệ & Hạ tầng</option>
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

      {/* 4. Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === paginatedRequests.length && paginatedRequests.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">Mã yêu cầu</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Vị trí cần tuyển</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Phòng ban / Khối</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Số lượng</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Khoảng lương dự kiến</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Người đề xuất</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải danh sách yêu cầu tuyển dụng từ cơ sở dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Chưa có yêu cầu tuyển dụng nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(req.id)}
                        onChange={() => toggleSelect(req.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-600 cursor-pointer hover:underline">
                      {req.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{req.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {req.level} • {req.location}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{req.department}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                      {req.quantity}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{req.salaryRange}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">
                        {req.proposerName}{" "}
                        <span className="text-slate-500 text-[11px]">({req.proposerRole})</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {req.proposedDate}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right">{renderStatusBadge(req.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Tổng số: <strong className="text-slate-800">{filteredRequests.length}</strong> yêu cầu tuyển dụng
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
              {filteredRequests.length === 0
                ? "0 – 0"
                : `${startIndex + 1} – ${endIndex}`}{" "}
              / {filteredRequests.length}
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

      {/* Modal: Thêm mới Yêu cầu tuyển dụng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Yêu Cầu Tuyển Dụng Mới (Headcount Request)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vị trí cần tuyển *</label>
            <input
              type="text"
              required
              placeholder="VD: Senior Data Engineer / Tech Lead..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng ban / Khối</label>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Phát triển Sản phẩm (Product)">Phát triển Sản phẩm (Product)</option>
                <option value="Khối Công nghệ & Hạ tầng">Khối Công nghệ & Hạ tầng</option>
                <option value="Trung tâm Đổi mới AI">Trung tâm Đổi mới AI</option>
                <option value="Khối Vận hành & Kinh doanh">Khối Vận hành & Kinh doanh</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số lượng tuyển</label>
              <input
                type="number"
                min="1"
                required
                value={formQuantity}
                onChange={(e) => setFormQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cấp bậc (Level)</label>
              <input
                type="text"
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa điểm làm việc</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Khoảng lương dự kiến</label>
            <input
              type="text"
              value={formSalary}
              onChange={(e) => setFormSalary(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Gửi phê duyệt</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
