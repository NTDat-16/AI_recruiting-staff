import React from "react";
import type { Metadata } from "next";
import { PipelineClient } from "./PipelineClient";

export const metadata: Metadata = {
  title: "Quy Trình Tuyển Dụng & Pipeline ATS | AI Talent Suite",
  description:
    "Quản lý vòng đời tuyển dụng, di chuyển ứng viên qua các vòng phỏng vấn và đánh giá phân tích AI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PipelinePage() {
  return <PipelineClient />;
}
