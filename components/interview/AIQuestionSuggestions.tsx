"use client";

import React from "react";
import { SuggestedQuestion } from "@/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AIQuestionSuggestionsProps {
  questions?: SuggestedQuestion[];
  onRefresh?: () => void;
  loading?: boolean;
}

export const AIQuestionSuggestions: React.FC<AIQuestionSuggestionsProps> = ({
  questions = [],
  onRefresh,
  loading = false,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return <Badge variant="success">Mức độ: Dễ</Badge>;
      case "hard":
        return <Badge variant="danger">Mức độ: Khó</Badge>;
      default:
        return <Badge variant="warning">Mức độ: Trung bình</Badge>;
    }
  };

  return (
    <Card className="border-indigo-100 shadow-sm">
      <CardHeader
        title="Gợi Ý Câu Hỏi Phỏng Vấn"
        subtitle="Bộ câu hỏi tình huống chuyên môn theo vị trí và hồ sơ năng lực của ứng viên"
        action={
          onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? "Đang tạo lại..." : "🔄 Làm mới câu hỏi"}
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            Chưa có câu hỏi gợi ý. Nhấn làm mới để tạo bộ câu hỏi phù hợp.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {q.category}
                  </span>
                  {getDifficultyBadge(q.difficulty)}
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Câu hỏi tham khảo #{idx + 1}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-900 mb-2">
                {idx + 1}. {q.question}
              </p>

              {q.rationale && (
                <p className="text-xs text-slate-600 mb-2.5">
                  <span className="font-semibold text-slate-700">Mục đích đánh giá:</span> {q.rationale}
                </p>
              )}

              {q.expected_answer_points && q.expected_answer_points.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1.5">
                    Kỳ vọng trong câu trả lời ứng viên:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {q.expected_answer_points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
