"use client";

import React, { useState, useEffect } from "react";
import { Interview, SuggestedQuestion } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SchedulePicker } from "@/components/interview/SchedulePicker";
import { AIQuestionSuggestions } from "@/components/interview/AIQuestionSuggestions";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/formatters";

export default function InterviewsDashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<SuggestedQuestion[] | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchInterviews = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/interviews", { headers });
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/candidates", { headers });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
        if (data.length > 0 && data[0].applications?.length > 0) {
          setSelectedAppId(data[0].applications[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
  }, []);

  const getCandidateInfo = (applicationId: string) => {
    for (const c of candidates) {
      const app = c.applications?.find((a: any) => a.id === applicationId);
      if (app) {
        return {
          candidateName: c.full_name,
          email: c.email,
          jobTitle: app.job_title || "Vị trí tuyển dụng",
        };
      }
    }
    return { candidateName: "Ứng viên", email: "", jobTitle: "" };
  };

  const handleScheduleSubmit = async (data: any) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const targetAppId = selectedAppId || candidates[0]?.applications[0]?.id;
      const payload = {
        application_id: targetAppId,
        title: "Phỏng vấn Chuyên môn Kỹ thuật",
        round_number: 1,
        ...data,
      };
      const res = await fetch("/api/v1/interviews", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsScheduleModalOpen(false);
        showNotification("success", "Đã tạo lịch phỏng vấn và gửi email mời kèm link phòng họp thực tế!");
        fetchInterviews();
      }
    } catch (e) {
      console.error(e);
      showNotification("error", "Lỗi khi lên lịch phỏng vấn.");
    }
  };

  const handleViewQuestions = async (interview: Interview) => {
    if (interview.ai_suggested_questions && interview.ai_suggested_questions.length > 0) {
      setSelectedQuestions(interview.ai_suggested_questions);
    } else {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/interviews/${interview.id}/suggest-questions`, {
          method: "POST",
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedQuestions(data.questions);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendInvitationEmail = async (interview: Interview) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/interviews/${interview.id}/send-invitation-email`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("success", data.message || "Đã phát hành email mời phỏng vấn thành công!");
      } else {
        showNotification("error", data.detail || "Không thể gửi email.");
      }
    } catch (e) {
      console.error(e);
      showNotification("error", "Lỗi kết nối khi gửi email.");
    }
  };

  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let action = "confirm";
      if (newStatus === "declined") action = "decline";
      else if (newStatus === "reschedule_requested") action = "reschedule";
      else if (newStatus === "confirmed") action = "confirm";

      const res = await fetch(`/api/v1/interviews/${interviewId}/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        showNotification(
          "success",
          newStatus === "declined"
            ? "Đã chuyển trạng thái buổi phỏng vấn sang 'Từ chối / Hủy' và tự động đồng bộ hồ sơ ứng viên thành 'Từ chối' (rejected)!"
            : "Đã cập nhật trạng thái buổi phỏng vấn thành công!"
        );
        fetchInterviews();
      }
    } catch (e) {
      console.error(e);
      showNotification("error", "Lỗi khi cập nhật trạng thái.");
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Lịch Phỏng Vấn Thông Minh</h1>
          <p className="text-xs text-slate-500 mt-1">
            Phòng họp video trực tuyến thực tế (Jitsi Meet), phát hành email tự động & quản lý trạng thái ứng viên
          </p>
        </div>
        <Button onClick={() => setIsScheduleModalOpen(true)}>+ Đặt Lịch Phỏng Vấn</Button>
      </div>

      <Card>
        <CardHeader
          title="Danh Sách Buổi Phỏng Vấn Tuyển Dụng"
          subtitle={`Tổng số: ${interviews.length} buổi phỏng vấn đã được ghi nhận`}
        />

        <Table>
          <Thead>
            <Tr>
              <Th>Ứng viên & Vị trí</Th>
              <Th>Thời gian</Th>
              <Th>Phòng họp trực tuyến (Thực tế)</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Tác vụ</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-slate-400">
                  Đang tải danh sách phỏng vấn...
                </Td>
              </Tr>
            ) : interviews.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-slate-400">
                  Chưa có lịch phỏng vấn nào được tạo.
                </Td>
              </Tr>
            ) : (
              interviews.map((item) => {
                const info = getCandidateInfo(item.application_id);
                return (
                  <Tr key={item.id}>
                    <Td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{info.candidateName}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Vòng {item.round_number}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600 font-medium">{info.jobTitle}</p>
                        {info.email && <p className="text-[11px] text-slate-400">📧 {info.email}</p>}
                      </div>
                    </Td>
                    <Td className="text-xs">
                      <div className="font-medium text-slate-800">{formatDate(item.scheduled_time)}</div>
                      <div className="text-slate-500 mt-0.5">Thời lượng: {item.duration_minutes} phút</div>
                    </Td>
                    <Td>
                      {item.format === "online" ? (
                        item.meeting_link ? (
                          <div className="space-y-1.5">
                            <a
                              href={item.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                            >
                              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
                              💻 Vào phòng họp thực tế
                            </a>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyLink(item.meeting_link!)}
                                className="text-[11px] text-slate-500 hover:text-indigo-600 underline font-medium"
                              >
                                {copiedLink === item.meeting_link ? "✅ Đã copy link!" : "📋 Sao chép link họp"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">💻 Online (Chưa sinh link)</span>
                        )
                      ) : (
                        <span className="text-xs text-slate-600">🏢 {item.location || "Văn phòng công ty"}</span>
                      )}
                    </Td>
                    <Td>
                      <select
                        value={item.confirmation_status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors cursor-pointer ${
                          item.confirmation_status === "confirmed"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.confirmation_status === "declined"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : item.confirmation_status === "reschedule_requested"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-slate-50 text-slate-700 border-slate-300"
                        }`}
                        title="Thay đổi trạng thái buổi phỏng vấn & tự động đồng bộ sang hồ sơ ứng viên"
                      >
                        <option value="pending">⏳ Chờ phản hồi</option>
                        <option value="confirmed">✅ Đã xác nhận</option>
                        <option value="declined">❌ Từ chối / Hủy</option>
                        <option value="reschedule_requested">⏰ Yêu cầu đổi giờ</option>
                      </select>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Nút Gửi lại email mời */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                          onClick={() => handleSendInvitationEmail(item)}
                          title="Gửi hoặc gửi lại thư mời phỏng vấn có chứa link phòng họp thực tế"
                        >
                          📧 Gửi email
                        </Button>

                        {/* Nút Xem câu hỏi gợi ý */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleViewQuestions(item)}
                        >
                          💡 Câu hỏi AI
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Schedule Picker Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Lên Lịch Phỏng Vấn Mới (Phát Hành Link Họp Thực Tế)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn Ứng Viên Phỏng Vấn (Từ Cơ Sở Dữ Liệu)
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {candidates.map((c) => {
                const app = c.applications?.[0];
                return (
                  <option key={c.id} value={app?.id || c.id}>
                    {c.full_name} ({c.email}) - {app?.job_title || "Hồ sơ"} [{app?.status || "Ứng tuyển"}]
                  </option>
                );
              })}
            </select>
          </div>
          <SchedulePicker onSchedule={handleScheduleSubmit} />
        </div>
      </Modal>

      {/* AI Questions Modal (Reference only) */}
      {selectedQuestions && (
        <Modal
          isOpen={!!selectedQuestions}
          onClose={() => setSelectedQuestions(null)}
          title="Bộ Câu Hỏi Gợi Ý Cho Interviewer (Chỉ Tham Khảo)"
          maxWidth="xl"
        >
          <AIQuestionSuggestions questions={selectedQuestions} />
        </Modal>
      )}
    </div>
  );
}
