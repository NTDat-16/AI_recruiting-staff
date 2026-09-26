"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TranscriptViewer } from "@/components/evaluation/TranscriptViewer";
import { TranscriptSegment } from "@/types";

export default function EvaluationsDashboardPage() {
  const [audioConsent, setAudioConsent] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasReport, setHasReport] = useState(true);

  // Mock initial demo transcript
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([
    {
      speaker: "Interviewer (HR)",
      start_time: 0,
      end_time: 15,
      text: "Chào bạn, cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay. Bạn có thể giới thiệu ngắn gọn về kinh nghiệm với FastAPI và hệ thống phân tán?",
    },
    {
      speaker: "Candidate",
      start_time: 16,
      end_time: 68,
      text: "Dạ vâng chào anh/chị. Em có hơn 3 năm làm việc với Python và 2 năm chuyên sâu về FastAPI. Ở dự án gần nhất, em thiết kế hệ thống xử lý tin nhắn và phân tích dữ liệu ứng viên bằng Celery worker và Redis queue...",
    },
    {
      speaker: "Interviewer (Tech Lead)",
      start_time: 69,
      end_time: 92,
      text: "Rất tốt. Vậy khi gặp hiện tượng database lock hoặc spike tải bất ngờ trên PostgreSQL, bạn đã áp dụng những chiến lược tối ưu nào?",
    },
    {
      speaker: "Candidate",
      start_time: 93,
      end_time: 154,
      text: "Em đã cấu hình connection pool với PgBouncer, đánh chỉ mục partial index trên các cột trạng thái truy vấn thường xuyên và sử dụng Redis để cache kết quả truy vấn đọc nhiều.",
    },
  ]);

  const handleAudioUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !audioConsent) return;
    setAnalyzing(true);
    // Simulate audio upload and STT + AI processing
    setTimeout(() => {
      setAnalyzing(false);
      setHasReport(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đánh Giá Sau Phỏng Vấn & Phân Tích Ghi Âm</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chuyển đổi âm thanh sang văn bản (STT), phân tách người nói và tổng hợp báo cáo đánh giá hợp nhất
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
