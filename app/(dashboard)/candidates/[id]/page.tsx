import React from "react";
import type { Metadata } from "next";
import { CandidateDetailClient } from "./CandidateDetailClient";

export const metadata: Metadata = {
  title: "Hồ Sơ Ứng Viên Chi Tiết | AI Talent Suite",
  description: "Chi tiết hồ sơ ứng viên, phân tích CV ATS và bảng điểm tiêu chí AI.",
  robots: {
    index: false,
    follow: false,
  },
};

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const resolvedParams = await params;
  return <CandidateDetailClient id={resolvedParams.id} />;
}
