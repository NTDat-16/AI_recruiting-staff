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
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<SuggestedQuestion[] | null>(null);
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const fetchInterviews = async () => {
    try {
      const res = await fetch("/api/v1/interviews");
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

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleScheduleSubmit = async (data: any) => {
    try {
      const payload = {
        application_id: "default-app-id",
        title: "Phỏng vấn Kỹ thuật Vòng 1",
        round_number: 1,
        ...data,
      };
      const res = await fetch("/api/v1/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsScheduleModalOpen(false);
        fetchInterviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewQuestions = async (interview: Interview) => {
    setActiveInterviewId(interview.id);
    if (interview.ai_suggested_questions && interview.ai_suggested_questions.length > 0) {
      setSelectedQuestions(interview.ai_suggested_questions);
    } else {
      setGeneratingQuestions(true);
      try {
        const res = await fetch(`/api/v1/interviews/${interview.id}/suggest-questions`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedQuestions(data.questions);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setGeneratingQuestions(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success">Đã xác nhận</Badge>;
      case "reschedule_requested":
        return <Badge variant="warning">Yêu cầu đổi giờ</Badge>;
      case "declined":
        return <Badge variant="danger">Từ chối</Badge>;
      default:
        return <Badge variant="info">Chờ phản hồi</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Lịch Phỏng Vấn Thông Minh</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chống trùng lịch, tự động sinh liên kết họp trực tuyến và đề xuất câu hỏi AI
          </p>
        </div>
        <Button onClick={() => setIsScheduleModalOpen(true)}>+ Đặt Lịch Phỏng Vấn</Button>
      </div>

      <Card>
        <CardHeader
          title="Lịch Phỏng Vấn Sắp Tới"
          subtitle={`Tổng số: ${interviews.length} buổi phỏng vấn`}
        />

        <Table>
          <Thead>
            <Tr>
              <Th>Vòng</Th>
              <Th>Tiêu đề</Th>
              <Th>Thời gian</Th>
              <Th>Hình thức</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Hỗ trợ AI</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={6} className="text-center py-6 text-slate-400">
                  Đang tải lịch phỏng vấn...
                </Td>
              </Tr>
            ) : interviews.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-6 text-slate-400">
                  Chưa có lịch phỏng vấn nào.
                </Td>
              </Tr>
            ) : (
              interviews.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-100">
                      Vòng {item.round_number}
                    </span>
                  </Td>
                  <Td className="font-medium text-slate-900">{item.title}</Td>
                  <Td className="text-xs">{formatDate(item.scheduled_time)} ({item.duration_minutes}p)</Td>
                  <Td>
                    {item.format === "online" ? (
                      item.meeting_link ? (
                        <a
                          href={item.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                        >
                          💻 Vào phòng họp
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">💻 Online</span>
                      )
                    ) : (
                      <span className="text-xs text-slate-500">🏢 {item.location || "Văn phòng"}</span>
                    )}
                  </Td>
                  <Td>{getStatusBadge(item.confirmation_status)}</Td>
                  <Td className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleViewQuestions(item)}>
                      💡 Câu hỏi gợi ý AI
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Schedule Picker Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Lên Lịch Phỏng Vấn Mới"
        maxWidth="lg"
      >
        <SchedulePicker onSchedule={handleScheduleSubmit} />
      </Modal>

      {/* AI Questions Modal */}
      {selectedQuestions && (
        <Modal
          isOpen={!!selectedQuestions}
          onClose={() => setSelectedQuestions(null)}
          title="Bộ Câu Hỏi Gợi Ý Cho Interviewer"
          maxWidth="xl"
        >
          <AIQuestionSuggestions questions={selectedQuestions} />
        </Modal>
      )}
    </div>
  );
}
