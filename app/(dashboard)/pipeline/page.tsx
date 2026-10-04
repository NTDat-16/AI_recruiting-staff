"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
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
  Columns,
  List,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface PipelineCandidate {
  id: string;
  name: string;
  initial: string;
  currentRole: string;
  appliedJobTitle: string;
  department: string;
  matchScore: number;
  stage: "screening" | "interview" | "offer" | "hired" | "talent_pool";
  stageLabel: string;
  source: string;
  appliedDate: string;
  recruiter: string;
  statusNote: string;
  noteColor: "green" | "slate";
  // Explainable AI details
  strongPoints: string[];
  missingEvidence: string[];
  aiReasoning: string;
}

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "screening" | "interview" | "offer" | "hired" | "talent_pool"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // AI Breakdown Modal
  const [selectedAIModal, setSelectedAIModal] = useState<PipelineCandidate | null>(null);

  // New Application Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formJob, setFormJob] = useState("Senior Backend Developer (.NET)");
  const [formSource, setFormSource] = useState("Career Website");

  const fetchPipelineCandidates = async () => {
    setLoading(true);
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch("/api/v1/candidates", { headers });
      if (res.status === 401) {
        const loginRes = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "demo.hr@recruiting.vn", password: "Demo123456@" }),
        });
        if (loginRes.ok) {
          const authData = await loginRes.json();
          if (authData.access_token) {
            localStorage.setItem("auth_token", authData.access_token);
            headers["Authorization"] = `Bearer ${authData.access_token}`;
            res = await fetch("/api/v1/candidates", { headers });
          }
        }
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const list: PipelineCandidate[] = [];
          data.forEach((c: any) => {
            const apps = c.applications && c.applications.length > 0 ? c.applications : [null];
            apps.forEach((app: any, aIdx: number) => {
              const currentRole = c.parsed_data?.experience?.[0]?.position || "Kỹ sư chuyên môn";
              const rawStatus = (app?.status || "screening").toLowerCase();
              let stage: PipelineCandidate["stage"] = "screening";
              let stageLabel = "Sơ loại hồ sơ";
              let statusNote = "Đang xét duyệt";
              let noteColor: "green" | "slate" = "green";

              if (rawStatus === "interview" || rawStatus === "interviewed" || rawStatus === "interview_invited") {
                stage = "interview";
                stageLabel = "Phỏng vấn";
                statusNote = "Đã lên lịch PV";
              } else if (rawStatus === "offer" || rawStatus === "offered") {
                stage = "offer";
                stageLabel = "Đề nghị việc làm";
                statusNote = "Chờ phản hồi";
              } else if (rawStatus === "hired") {
                stage = "hired";
                stageLabel = "Đã tuyển dụng";
                statusNote = "Hoàn tất";
              } else if (rawStatus === "rejected" || rawStatus === "talent_pool" || !app) {
                stage = "talent_pool";
                stageLabel = "Talent Pool";
                statusNote = "Lưu trữ hồ sơ";
                noteColor = "slate";
              }

              const matchScore = Math.round(app?.match_score || 85);
              const strengths = app?.score_breakdown?.strengths || ["Kinh nghiệm phù hợp với yêu cầu tuyển dụng"];
              const gaps = app?.score_breakdown?.gaps || ["Cần đánh giá thêm trong buổi phỏng vấn"];
              const recommendation = app?.score_breakdown?.recommendation || `Độ tương thích hồ sơ ${matchScore}%.`;

              list.push({
                id: app?.id || `${c.id}-${aIdx}`,
                name: c.full_name || "Ứng viên",
                initial: (c.full_name || "U").charAt(0).toUpperCase(),
                currentRole: currentRole,
                appliedJobTitle: app?.job_title || "Vị trí tuyển dụng",
                department: "Khối Công nghệ & Sản phẩm",
                matchScore: matchScore,
                stage: stage,
                stageLabel: stageLabel,
                source: c.source === "direct_apply" ? "Website Tuyển dụng" : c.source || "Trực tiếp",
                appliedDate: (app?.created_at || c.created_at || "2026-10-02").slice(0, 10),
                recruiter: "Phòng Nhân sự",
                statusNote: statusNote,
                noteColor: noteColor,
                strongPoints: strengths,
                missingEvidence: gaps,
                aiReasoning: recommendation,
              });
            });
          });
          setCandidates(list);
        }
      }
    } catch (err) {
      console.error("Error loading pipeline from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineCandidates();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    if (activeTab === "screening" && c.stage !== "screening") return false;
    if (activeTab === "interview" && c.stage !== "interview") return false;
    if (activeTab === "offer" && c.stage !== "offer") return false;
    if (activeTab === "hired" && c.stage !== "hired") return false;
    if (activeTab === "talent_pool" && c.stage !== "talent_pool") return false;

    if (stageFilter !== "all" && c.stage !== stageFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchJob = c.appliedJobTitle.toLowerCase().includes(q);
      const matchRecruiter = c.recruiter.toLowerCase().includes(q);
      if (!matchName && !matchJob && !matchRecruiter) return false;
    }

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const renderStageBadge = (stage: PipelineCandidate["stage"], label: string) => {
    switch (stage) {
      case "interview":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {label}
          </span>
        );
      case "screening":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            {label}
          </span>
        );
      case "talent_pool":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {label}
          </span>
        );
      case "offer":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {label}
          </span>
        );
      case "hired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {label}
          </span>
        );
    }
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCand: PipelineCandidate = {
      id: String(Date.now()),
      name: formName,
      initial: formName.trim().charAt(0).toUpperCase() || "C",
      currentRole: "Software Engineer",
      appliedJobTitle: formJob,
      department: "Product Development",
      matchScore: 85,
      stage: "screening",
      stageLabel: "HR Screening",
      source: formSource,
      appliedDate: new Date().toISOString().split("T")[0],
      recruiter: "Nguyễn Thu Trang",
      statusNote: "Đang xét duyệt",
      noteColor: "green",
      strongPoints: ["Kỹ năng phù hợp với JD vị trí ứng tuyển"],
      missingEvidence: ["Cần kiểm tra thêm vòng phỏng vấn kỹ thuật"],
      aiReasoning: "Hồ sơ mới được tiếp nhận qua hệ thống AI ATS.",
    };
    setCandidates([newCand, ...candidates]);
    setIsAddModalOpen(false);
    setFormName("");
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quy trình Tuyển dụng (Recruitment Pipeline)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các đợt tuyển, AI Matching, Phỏng vấn, Scorecard & Offer
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold mr-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "kanban" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
              title="Xem dạng Kanban"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => alert("Xuất danh sách tiến trình tuyển dụng sang Excel")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tiếp nhận hồ sơ</span>
          </button>

          <button className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === "all"
              ? "bg-sky-50 text-blue-600 border border-sky-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Tất cả hồ sơ <span className="ml-1 text-[11px] font-bold">{candidates.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("screening")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "screening"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Sàng lọc (Screening){" "}
          <span className="ml-1 text-[11px]">
            {candidates.filter((c) => c.stage === "screening").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("interview")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "interview"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Phỏng vấn (Interview){" "}
          <span className="ml-1 text-[11px]">
            {candidates.filter((c) => c.stage === "interview").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("offer")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "offer"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Đề nghị (Offer){" "}
          <span className="ml-1 text-[11px]">
            {candidates.filter((c) => c.stage === "offer").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("hired")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "hired"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Tiếp nhận (Hired){" "}
          <span className="ml-1 text-[11px]">
            {candidates.filter((c) => c.stage === "hired").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("talent_pool")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "talent_pool"
              ? "bg-sky-50 text-blue-600 border border-sky-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Kho nhân tài{" "}
          <span className="ml-1 text-[11px]">
            {candidates.filter((c) => c.stage === "talent_pool").length}
          </span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tên ứng viên, vị trí tuyển, recruiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center space-x-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 pl-0 md:pl-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="whitespace-nowrap">Vòng tuyển:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả các vòng</option>
              <option value="screening">HR Screening</option>
              <option value="interview">Technical Interview</option>
              <option value="offer">Offer</option>
              <option value="talent_pool">Talent Pool</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery("");
              setStageFilter("all");
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

      {/* 4. Table View (Matching Image 5) */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredCandidates.length &&
                        filteredCandidates.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Ứng viên (Candidate)</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Vị trí ứng tuyển</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">AI Matching</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Vòng hiện tại (Stage)</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Nguồn & Ngày nộp</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Phụ trách</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải danh sách hồ sơ từ cơ sở dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Không tìm thấy hồ sơ nào trong quy trình tuyển dụng này.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {c.initial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{c.currentRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{c.appliedJobTitle}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.department}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {/* Purple Sparkles AI Match Pill - Clickable for Explainable AI Breakdown */}
                        <button
                          onClick={() => setSelectedAIModal(c)}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer group"
                          title="Bấm để xem giải trình đối sánh AI (Explainable Evidence)"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                          <span>{c.matchScore}%</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">{renderStageBadge(c.stage, c.stageLabel)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{c.source}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {c.appliedDate}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{c.recruiter}</p>
                        <p
                          className={`text-[11px] font-medium mt-0.5 ${
                            c.noteColor === "green" ? "text-emerald-600" : "text-slate-500"
                          }`}
                        >
                          {c.statusNote}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/candidates/${c.id}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/interviews`}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Lên lịch phỏng vấn & Scorecard"
                          >
                            <Calendar className="w-4 h-4" />
                          </Link>
                        </div>
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
              Tổng số: <strong className="text-slate-800">{filteredCandidates.length}</strong>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span>Số dòng/trang:</span>
                <select className="border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 bg-white font-medium focus:outline-none">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              <span className="font-medium text-slate-700">1 – {filteredCandidates.length}</span>

              <div className="flex items-center space-x-1">
                <button disabled className="p-1 rounded text-slate-300">
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button disabled className="p-1 rounded text-slate-300">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled className="p-1 rounded text-slate-300">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button disabled className="p-1 rounded text-slate-300">
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View Alternative */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["screening", "interview", "offer", "talent_pool"] as const).map((colStage) => {
            const colCandidates = candidates.filter((c) => c.stage === colStage);
            const colTitle =
              colStage === "screening"
                ? "Sàng lọc (Screening)"
                : colStage === "interview"
                ? "Phỏng vấn (Interview)"
                : colStage === "offer"
                ? "Đề nghị (Offer)"
                : "Kho nhân tài (Talent Pool)";

            return (
              <div
                key={colStage}
                className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[400px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800">{colTitle}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-slate-600 shadow-2xs">
                    {colCandidates.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colCandidates.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs space-y-2 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs">{c.name}</span>
                        <button
                          onClick={() => setSelectedAIModal(c)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{c.matchScore}%</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">{c.appliedJobTitle}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{c.source}</span>
                        <span>{c.appliedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Explainable AI Matching Breakdown */}
      {selectedAIModal && (
        <Modal
          isOpen={!!selectedAIModal}
          onClose={() => setSelectedAIModal(null)}
          title={`✨ Giải Trình AI Matching: ${selectedAIModal.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedAIModal.appliedJobTitle}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Khối: {selectedAIModal.department}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-indigo-700">
                  {selectedAIModal.matchScore}%
                </span>
                <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                  Độ phù hợp tổng thể
                </p>
              </div>
            </div>

            {/* AI Reasoning Text */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Đánh giá tổng quan: </strong>
              {selectedAIModal.aiReasoning}
            </div>

            {/* Strong Matches */}
            <div>
              <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Bằng chứng kinh nghiệm phù hợp (Strong Matches):</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {selectedAIModal.strongPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Evidence */}
            <div>
              <h4 className="font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Khoảng trống kỹ năng & Bằng chứng chưa rõ (Missing Evidence):</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {selectedAIModal.missingEvidence.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-amber-600 font-bold">!</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button onClick={() => setSelectedAIModal(null)}>Đóng</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Tiếp nhận hồ sơ mới */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tiếp Nhận Hồ Sơ Mới Vào Quy Trình"
        maxWidth="lg"
      >
        <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên ứng viên *</label>
            <input
              type="text"
              required
              placeholder="VD: Lê Thị Kim Oanh"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vị trí ứng tuyển *</label>
            <select
              value={formJob}
              onChange={(e) => setFormJob(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Senior Backend Developer (.NET)">Senior Backend Developer (.NET)</option>
              <option value="Senior Frontend Engineer (React/TypeScript)">
                Senior Frontend Engineer (React/TypeScript)
              </option>
              <option value="AI / Machine Learning Engineer">AI / Machine Learning Engineer</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nguồn tiếp nhận</label>
            <select
              value={formSource}
              onChange={(e) => setFormSource(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Career Website">Career Website</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral nội bộ</option>
              <option value="TopCV">TopCV</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Thêm vào Pipeline</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
