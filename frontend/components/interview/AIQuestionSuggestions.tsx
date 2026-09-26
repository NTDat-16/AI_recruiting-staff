"use client";

import React, { useState } from "react";
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
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  const toggleSelect = (index: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return <Badge variant="success">Dễ</Badge>;
      case "hard":
        return <Badge variant="danger">Khó</Badge>;
      default:
        return <Badge variant="warning">Trung bình</Badge>;
    }
  };

  return (
    <Card className="border-indigo-100">
      <CardHeader
        title="Gợi Ý Câu Hỏi Phỏng Vấn (AI Assisted)"
        subtitle="Bộ câu hỏi tình huống được cá nhân hóa theo JD và hồ sơ năng lực của ứng viên"
        action={
          onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? "Đang tạo lại..." : "🔄 Làm mới câu hỏi"}
            </Button>
          )
        }
      />

      <div className="space-y-3.5">
        {questions.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">
            Chưa có câu hỏi gợi ý. Nhấn làm mới để AI phân tích và đề xuất.
          </div>
        ) : (
          questions.map((q, idx) => {
            const isSelected = selectedQuestions.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleSelect(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {q.category}
                    </span>
                    {getDifficultyBadge(q.difficulty)}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <p className="text-sm font-semibold text-slate-900 mb-2">
                  {idx + 1}. {q.question}
                </p>

                <p className="text-xs text-slate-600 mb-2.5">
                  <span className="font-semibold text-slate-700">Mục đích:</span> {q.rationale}
                </p>

                {q.expected_answer_points && q.expected_answer_points.length > 0 && (
                  <div className="bg-slate-50/80 rounded-lg p-2.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700 block mb-1">
                      Kỳ vọng trong câu trả lời:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {q.expected_answer_points.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
