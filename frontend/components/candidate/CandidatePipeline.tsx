"use client";

import React from "react";
import { Candidate, PipelineStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { formatScore, getScoreColor } from "@/lib/utils/formatters";
import Link from "next/link";

interface CandidatePipelineProps {
  candidates: Candidate[];
  onStatusChange?: (candidateId: string, applicationId: string, newStatus: PipelineStatus) => void;
}

const STAGES: { key: PipelineStatus; label: string; color: string }[] = [
  { key: "new", label: "Mới ứng tuyển", color: "bg-blue-500" },
  { key: "reviewing", label: "Đang xem xét", color: "bg-indigo-500" },
  { key: "interview_invited", label: "Mời phỏng vấn", color: "bg-amber-500" },
  { key: "interviewed", label: "Đã phỏng vấn", color: "bg-purple-500" },
  { key: "offered", label: "Gửi Offer", color: "bg-emerald-500" },
  { key: "hired", label: "Trúng tuyển", color: "bg-teal-600" },
  { key: "talent_pool", label: "Talent Pool", color: "bg-slate-500" },
];

export const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
  candidates,
  onStatusChange,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      {STAGES.map((stage) => {
        const stageCandidates = candidates.filter((c) =>
          c.applications.some((app) => app.status === stage.key)
        );

        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-72 bg-slate-100/70 rounded-xl p-3 flex flex-col max-h-[750px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <h4 className="text-sm font-semibold text-slate-800">{stage.label}</h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {stageCandidates.length}
              </span>
            </div>

            {/* Candidates Cards List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {stageCandidates.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  Không có ứng viên
                </div>
              ) : (
                stageCandidates.map((candidate) => {
                  const sortedApps = [...(candidate.applications || [])].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  );
                  const app = sortedApps.find((a) => a.status === stage.key) || sortedApps[0];
                  return (
                    <Card
                      key={candidate.id}
                      className="p-3.5 hover:shadow-md transition-shadow cursor-pointer border-slate-200"
                    >
                      <Link href={`/candidates/${candidate.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <CandidateAvatar
                              src={candidate.avatar_url}
                              name={candidate.full_name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <h5 className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate">
                                {candidate.full_name}
                              </h5>
                              <p className="text-[11px] text-slate-500 truncate">{candidate.email}</p>
                              {app?.job_title && (
                                <p className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">
                                  📌 {app.job_title}
                                </p>
                              )}
                            </div>
                          </div>
                          {app?.match_score !== undefined && (
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 ${getScoreColor(
                                app.match_score
                              )}`}
                            >
                              {formatScore(app.match_score)}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Tags */}
                      {candidate.tags && candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {candidate.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="default" className="text-[10px] py-0 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Quick Move Action */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Chuyển bước:</span>
                        <select
                          className="bg-transparent text-xs font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                          value={stage.key}
                          onChange={(e) => {
                            if (app && onStatusChange) {
                              onStatusChange(candidate.id, app.id, e.target.value as PipelineStatus);
                            }
                          }}
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                          <option value="rejected">Từ chối</option>
                        </select>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
