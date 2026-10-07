import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function formatScore(score: number | undefined): string {
  if (score === undefined || score === null) return "N/A";
  return `${Math.round(score)}%`;
}

export function getScoreColor(score: number | undefined): string {
  if (score === undefined || score === null) return "text-gray-500 bg-gray-100";
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

export function formatSource(source: string | undefined): string {
  if (!source) return "Cổng tuyển dụng";
  const s = source.toLowerCase();
  if (s.includes("referral") || s === "internal") return "Giới thiệu nội bộ";
  if (s.includes("topcv")) return "TopCV";
  if (s.includes("linkedin")) return "LinkedIn";
  if (s.includes("vietnamworks")) return "VietnamWorks";
  if (s.includes("website") || s.includes("career")) return "Cổng tuyển dụng";
  if (s.includes("headhunt")) return "Headhunter";
  return source;
}

export function formatStage(stage: string | undefined): string {
  if (!stage) return "Tiếp nhận";
  const s = stage.toLowerCase();
  switch (s) {
    case "new":
      return "Tiếp nhận";
    case "screening":
    case "reviewing":
      return "Sàng lọc CV";
    case "interview":
    case "interview_invited":
      return "Mời phỏng vấn";
    case "interviewed":
      return "Đã phỏng vấn";
    case "offer":
    case "offered":
      return "Đề xuất Offer";
    case "hired":
      return "Đã tuyển dụng";
    case "talent_pool":
      return "Kho nhân tài";
    case "rejected":
      return "Chưa phù hợp";
    default:
      return stage;
  }
}

export function formatExperienceComparison(
  achievedYears?: number | null,
  requiredYears?: number | null
): { text: string; badge: string; isMatch: boolean } {
  if (achievedYears === undefined || achievedYears === null) {
    return { text: "Chưa xác định", badge: "", isMatch: false };
  }
  const req = requiredYears || 3;
  const isMatch = achievedYears >= req;
  const diff = Math.round((achievedYears - req) * 10) / 10;
  const text = `${achievedYears} / ${req} năm`;
  const badge = isMatch
    ? diff > 0
      ? `Vượt kỳ vọng (+${diff} năm)`
      : "Đạt chuẩn yêu cầu"
    : `Thiếu ${Math.abs(diff)} năm`;
  return { text, badge, isMatch };
}
