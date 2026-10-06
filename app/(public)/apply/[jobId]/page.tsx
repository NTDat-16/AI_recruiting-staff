import React from "react";
import type { Metadata } from "next";
import { ApplyFormClient } from "./ApplyFormClient";

export const metadata: Metadata = {
  title: "Ứng Tuyển Cơ Hội Nghề Nghiệp | AI Talent Suite",
  description: "Cổng nộp CV trực tuyến an toàn với hệ thống sàng lọc AI ATS tự động.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ApplyJobPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ApplyJobPage({ params }: ApplyJobPageProps) {
  const resolvedParams = await params;

  return (
    <div className="py-6">
      <ApplyFormClient jobId={resolvedParams.jobId} />
    </div>
  );
}
