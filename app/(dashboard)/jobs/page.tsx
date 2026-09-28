"use client";

import React, { useState, useEffect } from "react";
import { JobPosting } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/formatters";

export default function JobsDashboardPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Hà Nội");
  const [salaryRange, setSalaryRange] = useState("30,000,000 - 45,000,000 VND");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skillWeight, setSkillWeight] = useState(0.4);
  const [expWeight, setExpWeight] = useState(0.3);
  const [eduWeight, setEduWeight] = useState(0.15);
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch("/api/v1/jobs", { headers });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        return;
      }
      // Fallback to public jobs if not yet logged in or different role
      const pubRes = await fetch("/api/v1/jobs/public");
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setJobs(pubData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        title,
        department,
        location,
        salary_range: salaryRange,
        description,
        requirements,
        ai_criteria_weights: {
          required_skills: skillWeight,
          experience_years: expWeight,
          education: eduWeight,
          bonus_skills: +(1 - skillWeight - expWeight - eduWeight).toFixed(2),
        },
      };

      const res = await fetch("/api/v1/jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch(`/api/v1/jobs/${id}/publish`, { method: "POST", headers });
    fetchJobs();
  };

  const handleClose = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch(`/api/v1/jobs/${id}/close`, { method: "POST", headers });
    fetchJobs();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Đang tuyển</Badge>;
      case "paused":
        return <Badge variant="warning">Tạm dừng</Badge>;
      case "closed":
        return <Badge variant="danger">Đã đóng</Badge>;
      default:
        return <Badge variant="default">Bản nháp</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Tin Tuyển Dụng</h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập và quản lý các vị trí tuyển dụng cùng tiêu chí đánh giá ứng viên
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Tạo Tin Tuyển Dụng Mới</Button>
      </div>

      <Card>
        <CardHeader
          title="Danh Sách Tin Đăng"
          subtitle={`Tổng số: ${jobs.length} tin`}
        />

        <Table>
          <Thead>
            <Tr>
              <Th>Vị trí</Th>
              <Th>Phòng ban</Th>
              <Th>Địa điểm</Th>
              <Th>Trạng thái</Th>
              <Th>Ngày tạo</Th>
              <Th className="text-right">Thao tác</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={6} className="text-center py-6 text-slate-400">
                  Đang tải danh sách...
                </Td>
              </Tr>
            ) : jobs.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-6 text-slate-400">
                  Chưa có tin tuyển dụng nào được tạo.
                </Td>
              </Tr>
            ) : (
              jobs.map((job) => (
                <Tr key={job.id}>
                  <Td className="font-semibold text-slate-900">{job.title}</Td>
                  <Td>{job.department || "—"}</Td>
                  <Td>{job.location || "—"}</Td>
                  <Td>{getStatusBadge(job.status)}</Td>
                  <Td className="text-xs">{formatDate(job.created_at)}</Td>
                  <Td className="text-right space-x-2">
                    {job.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => handlePublish(job.id)}>
                        Công khai
                      </Button>
                    )}
                    {job.status === "published" && (
                      <Button size="sm" variant="danger" onClick={() => handleClose(job.id)}>
                        Đóng tin
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Modal create job */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Tin Tuyển Dụng Mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề vị trí *</label>
            <input
              type="text"
              required
              placeholder="VD: Senior Backend Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng ban</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức lương</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả công việc</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả trách nhiệm công việc chính..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Yêu cầu ứng viên</label>
            <textarea
              rows={3}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Kỹ năng bắt buộc, kinh nghiệm làm việc, học vấn..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Criteria Weights Configuration */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase">
              ⚙️ Tiêu chí và trọng số đánh giá
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Kỹ năng ({Math.round(skillWeight * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={skillWeight}
                  onChange={(e) => setSkillWeight(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Kinh nghiệm ({Math.round(expWeight * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={expWeight}
                  onChange={(e) => setExpWeight(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Học vấn ({Math.round(eduWeight * 100)}%)</label>
                <input
                  type="range"
                  min="0.05"
                  max="0.4"
                  step="0.05"
                  value={eduWeight}
                  onChange={(e) => setEduWeight(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu tin tuyển dụng"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
