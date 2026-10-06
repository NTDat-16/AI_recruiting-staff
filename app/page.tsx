import React from "react";
import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Tổng Quan Tuyển Dụng & Phân Tích Dữ Liệu AI ATS | AI Talent Suite",
  description:
    "Bảng điều khiển quản trị nhân sự, tỷ lệ chuyển đổi phễu tuyển dụng và trợ lý phân tích dữ liệu AI Copilot.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
