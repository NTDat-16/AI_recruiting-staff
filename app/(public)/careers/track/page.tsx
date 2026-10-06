import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CareerTrackClient } from "./CareerTrackClient";

export const metadata: Metadata = {
  title: "Tra Cứu Trạng Thái Hồ Sơ Ứng Tuyển | AI Talent Suite",
  description: "Theo dõi tiến độ xét duyệt hồ sơ ứng tuyển trực tiếp theo thời gian thực.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CandidateTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-16 text-center text-slate-400 text-sm">
          Đang tải dữ liệu tra cứu tiến độ hồ sơ...
        </div>
      }
    >
      <CareerTrackClient />
    </Suspense>
  );
}
