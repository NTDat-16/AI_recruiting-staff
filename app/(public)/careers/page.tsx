import { Metadata } from "next";
import CareerJobListClient from "./CareerJobListClient";

// 1. ISR: Pre-render danh sách việc làm tĩnh trên CDN và tự động revalidate ngầm mỗi 60 giây
export const revalidate = 60;

const getInternalApiUrl = () => {
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

// 2. Metadata tối ưu hóa SEO cho Cổng Việc Làm Công Khai
export const metadata: Metadata = {
  title: "Cổng Việc Làm & Tuyển Dụng Công Nghệ AI — AI Talent Suite",
  description:
    "Khám phá các vị trí tuyển dụng AI Engineer, Fullstack Developer, Product Manager tại AI Talent Suite. Ứng tuyển nhanh trong 30 giây với Quick Apply.",
  alternates: {
    canonical: "https://ai-recruiting-staff.vercel.app/careers",
  },
  openGraph: {
    title: "Cổng Việc Làm & Tuyển Dụng Công Nghệ AI — AI Talent Suite",
    description:
      "Khám phá các vị trí tuyển dụng AI Engineer, Fullstack Developer, Product Manager tại AI Talent Suite.",
    url: "https://ai-recruiting-staff.vercel.app/careers",
    siteName: "AI Talent Suite",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "https://ai-recruiting-staff.vercel.app/favicon.ico",
        width: 1200,
        height: 630,
        alt: "Cổng Tuyển Dụng AI Talent Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cổng Việc Làm & Tuyển Dụng Công Nghệ AI — AI Talent Suite",
    description: "Khám phá các cơ hội nghề nghiệp kỹ thuật hàng đầu.",
    images: ["https://ai-recruiting-staff.vercel.app/favicon.ico"],
  },
};

// 3. Server Component nạp trước danh sách việc làm ban đầu lúc build / ISR
export default async function CareersPage() {
  const apiUrl = getInternalApiUrl();
  let initialJobs = [];

  try {
    const res = await fetch(`${apiUrl}/api/v1/jobs/public`, {
      next: { revalidate: 60, tags: ["jobs-list"] },
    });
    if (res.ok) {
      initialJobs = await res.json();
    }
  } catch (error) {
    console.error("Lỗi nạp danh sách việc làm từ server:", error);
  }

  return <CareerJobListClient initialJobs={Array.isArray(initialJobs) ? initialJobs : []} />;
}
