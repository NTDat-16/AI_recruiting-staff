"use client";

import React, { useState } from "react";
import { ScoreBreakdown } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatScore, getScoreColor } from "@/lib/utils/formatters";

interface MatchScoreCardProps {
  scoreBreakdown?: ScoreBreakdown;
  applicationId: string;
  initialFeedback?: { accuracy_rating: number; comment?: string };
  onFeedbackSubmitted?: () => void;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({
  scoreBreakdown,
  applicationId,
  initialFeedback,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState<number>(initialFeedback?.accuracy_rating || 0);
  const [comment, setComment] = useState<string>(initialFeedback?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!initialFeedback);

  if (!scoreBreakdown) {
    return (
      <Card className="border-dashed">
        <div className="text-center py-6 text-slate-500">
          <p>Chưa có dữ liệu chấm điểm AI cho hồ sơ này.</p>
        </div>
      </Card>
    );
  }

  const handleFeedback = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/candidates/applications/${applicationId}/score-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accuracy_rating: rating, comment }),
      });
      if (res.ok) {
        setSubmitted(true);
        if (onFeedbackSubmitted) onFeedbackSubmitted();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-indigo-100 bg-gradient-to-b from-indigo-50/20 to-white">
      <CardHeader
        title="AI Đánh Giá & Chấm Điểm Phù Hợp"
        subtitle="So khớp ngữ nghĩa tự động giữa CV ứng viên và bản mô tả công việc (JD)"
        action={
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Điểm phù hợp:</span>
            <span
              className={`text-xl font-bold px-3 py-1 rounded-lg border ${getScoreColor(
                scoreBreakdown.overall_score
              )}`}
            >
              {formatScore(scoreBreakdown.overall_score)}
            </span>
          </div>
        }
      />

      {/* Recommendation Banner */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-3.5 mb-6 text-sm text-indigo-900 flex items-start space-x-2">
        <span className="text-indigo-600 font-bold">💡 Đề xuất:</span>
        <p className="font-medium">{scoreBreakdown.recommendation}</p>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chi tiết theo tiêu chí đánh giá
        </h4>
        <div className="grid gap-3">
          {scoreBreakdown.breakdown?.map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-semibold text-slate-800">
                  {item.name} <span className="text-xs font-normal text-slate-400">(Trọng số: {Math.round(item.weight * 100)}%)</span>
                </span>
                <span className="text-sm font-bold text-slate-700">{Math.round(item.score)}/100</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border border-emerald-200/80 bg-emerald-50/30 rounded-lg p-3.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
            Điểm mạnh nổi bật (Strengths)
          </h5>
          <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside">
            {scoreBreakdown.strengths?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="border border-amber-200/80 bg-amber-50/30 rounded-lg p-3.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            Điểm còn thiếu sót (Gaps)
          </h5>
          <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
            {scoreBreakdown.gaps?.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Human-in-the-loop feedback */}
      <div className="border-t border-slate-100 pt-4 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h5 className="text-xs font-bold text-slate-700">Đánh giá độ chính xác của AI (Human-in-the-loop)</h5>
            <p className="text-xs text-slate-500">Giúp hệ thống học hỏi và tinh chỉnh thuật toán chấm điểm sau này</p>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => !submitted && setRating(star)}
                disabled={submitted}
                className={`text-xl ${rating >= star ? "text-amber-400" : "text-slate-300"} hover:scale-110 transition-transform`}
              >
                ★
              </button>
            ))}
            {!submitted && rating > 0 && (
              <Button size="sm" variant="outline" className="ml-2 text-xs" onClick={handleFeedback} disabled={submitting}>
                {submitting ? "Đang lưu..." : "Gửi feedback"}
              </Button>
            )}
            {submitted && <Badge variant="success" className="ml-2">Đã lưu feedback</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
};
