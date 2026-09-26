"use client";

import React, { useState } from "react";
import { TranscriptSegment } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  audioFileUrl?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript = [],
  audioFileUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);

  const filteredSegments = transcript.filter((seg) =>
    seg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader
        title="Biên Bản Băng Ghi Âm Phỏng Vấn (Transcript)"
        subtitle="Hệ thống Speech-to-Text tự động phân tách người nói (Speaker Diarization) và gán timestamp"
        action={
          <div className="w-56">
            <input
              type="text"
              placeholder="🔍 Tìm trong transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        }
      />

      {/* Audio Player Bar */}
      {audioFileUrl && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🎙️</span>
            <div>
              <p className="text-xs font-semibold text-slate-800">File ghi âm phỏng vấn</p>
              <p className="text-[11px] text-slate-500">Đã nhận được sự đồng ý bảo mật dữ liệu của ứng viên</p>
            </div>
          </div>
          <audio controls className="h-8 max-w-xs">
            <source src={audioFileUrl} type="audio/mpeg" />
            Trình duyệt không hỗ trợ phát audio.
          </audio>
        </div>
      )}

      {/* Segments timeline */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredSegments.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-400">
            {searchTerm ? "Không tìm thấy nội dung khớp từ khóa." : "Chưa có transcript cho buổi phỏng vấn này."}
          </p>
        ) : (
          filteredSegments.map((seg, idx) => {
            const isCandidate =
              seg.speaker.toLowerCase().includes("candidate") ||
              seg.speaker.toLowerCase().includes("ứng viên");

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCandidate
                    ? "bg-slate-50/80 border-slate-200"
                    : "bg-indigo-50/40 border-indigo-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isCandidate
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {seg.speaker}
                    </span>
                    <button
                      onClick={() => setActiveTimestamp(seg.start_time)}
                      className="text-[11px] font-mono text-slate-500 hover:text-indigo-600 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      ⏱ {formatTimestamp(seg.start_time)} - {formatTimestamp(seg.end_time)}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{seg.text}</p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
