"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TranscriptViewer } from "@/components/evaluation/TranscriptViewer";
import { TranscriptSegment, Interview } from "@/types";

export default function EvaluationsDashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");
  const [audioConsent, setAudioConsent] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [aiRating, setAiRating] = useState<number>(0);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");

  const fetchReport = async (interviewId: string) => {
    if (!interviewId) return;
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/evaluations/interview/${interviewId}/consolidated-report`, { headers });
      if (res.ok) {
        const report = await res.json();
        setHasReport(true);
        if (report.ai_evaluation?.transcript && Array.isArray(report.ai_evaluation.transcript)) {
          setTranscript(report.ai_evaluation.transcript);
        } else {
          setTranscript([]);
        }
        if (report.ai_evaluation?.rating) {
          setAiRating(report.ai_evaluation.rating);
        } else if (report.manual_evaluation?.score) {
          setAiRating(report.manual_evaluation.score);
        }
        if (report.ai_evaluation?.recommendation) {
          setAiRecommendation(report.ai_evaluation.recommendation);
        }
      } else {
        setHasReport(false);
        setTranscript([]);
        setAiRating(0);
        setAiRecommendation("");
      }
    } catch {
      setHasReport(false);
      setTranscript([]);
    }
  };

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        let res = await fetch("/api/v1/interviews", { headers });
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
              res = await fetch("/api/v1/interviews", { headers });
            }
          }
        }

        if (res.ok) {
          const data = await res.json();
          setInterviews(data);
          if (data.length > 0) {
            setSelectedInterviewId(data[0].id);
            fetchReport(data[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchInterviews();
  }, []);

  const handleSelectInterview = (id: string) => {
    setSelectedInterviewId(id);
    fetchReport(id);
  };

  const handleAudioUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !audioConsent || !selectedInterviewId) return;
    setAnalyzing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append("interview_id", selectedInterviewId);
      formData.append("candidate_consent", String(audioConsent));
      formData.append("audio_file", audioFile);

      const res = await fetch("/api/v1/evaluations/upload-audio", {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.ok) {
        const report = await res.json();
        if (report.transcript && Array.isArray(report.transcript)) {
          setTranscript(report.transcript);
        }
        if (report.ai_rating) {
          setAiRating(report.ai_rating);
        }
        if (report.ai_recommendation) {
          setAiRecommendation(report.ai_recommendation);
        }
        setHasReport(true);
      }
    } catch (e) {
      console.error("Audio evaluation error:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đánh Giá Sau Phỏng Vấn</h1>
        <p className="text-xs text-slate-500 mt-1">
          Phân tích nội dung phỏng vấn, nhận diện phản hồi và tổng hợp báo cáo đánh giá
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Audio Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Tải Lên Băng Ghi Âm Buổi Phỏng Vấn"
              subtitle="Hỗ trợ MP3, WAV, M4A"
            />
            <form onSubmit={handleAudioUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn Buổi Phỏng Vấn</label>
                <select
                  value={selectedInterviewId}
                  onChange={(e) => handleSelectInterview(e.target.value)}
                  className="w-full text-xs text-slate-700 border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {interviews.map((itv) => (
                    <option key={itv.id} value={itv.id}>
                      {itv.title} ({itv.format} - {itv.confirmation_status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn file âm thanh</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Consent Guardrail Checkbox */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="consent-check"
                    checked={audioConsent}
                    onChange={(e) => setAudioConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="consent-check" className="text-[11px] text-amber-900 font-medium leading-tight">
                    Xác nhận đã có sự đồng ý rõ ràng (consent) của ứng viên trước khi ghi âm và phân tích theo quy định bảo vệ dữ liệu cá nhân.
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={analyzing || !audioFile || !audioConsent} className="w-full">
                {analyzing ? "Đang STT & Phân tích Rubric..." : "Phân tích buổi phỏng vấn"}
              </Button>
            </form>
          </Card>

          {/* AI Rubric Score Summary */}
          <Card className="border-indigo-100 bg-indigo-50/20">
            <CardHeader
              title="Đánh Giá AI Theo Rubric"
              subtitle="Tổng hợp từ nội dung đối thoại trong buổi phỏng vấn"
            />
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-indigo-100">
                <span className="font-semibold text-slate-700">Điểm tổng quát:</span>
                <Badge variant="success" className="font-bold text-sm">8.4 / 10</Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-indigo-100">
                <span className="text-slate-600">Kiến thức chuyên môn:</span>
                <span className="font-bold text-slate-800">8.5/10</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-indigo-100">
                <span className="text-slate-600">Kỹ năng giao tiếp:</span>
                <span className="font-bold text-slate-800">8.2/10</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-indigo-100">
                <span className="text-slate-600">Mức độ phù hợp văn hóa:</span>
                <span className="font-bold text-slate-800">8.5/10</span>
              </div>
              <div className="pt-2">
                <span className="font-semibold text-slate-700 block mb-1">Khuyến nghị AI:</span>
                <p className="text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
                  Đạt (Pass) - Chuyển sang vòng phỏng vấn văn hóa hoặc thương lượng Offer
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transcript Viewer */}
        <div className="lg:col-span-2">
          <TranscriptViewer
            transcript={transcript}
            audioFileUrl="https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg"
          />
        </div>
      </div>
    </div>
  );
}
