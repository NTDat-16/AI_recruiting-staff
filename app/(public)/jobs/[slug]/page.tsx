import { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";

// 1. Cấu hình ISR: Tự động revalidate sau 1 giờ hoặc on-demand qua webhook
export const revalidate = 3600;

const getInternalApiUrl = () => {
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

// 2. Pre-generate danh sách slug các tin tuyển dụng lúc build (ISR)
export async function generateStaticParams() {
  const apiUrl = getInternalApiUrl();
  try {
    const res = await fetch(`${apiUrl}/api/v1/jobs/public`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const jobs = await res.json();
    if (Array.isArray(jobs)) {
      return jobs.map((j: any) => ({ slug: j.slug }));
    }
    return [];
  } catch {
    return [];
  }
}

// 3. Tự động sinh thẻ Meta OpenGraph & Twitter Cards (Chuẩn xem trước như Shopee khi chia sẻ link)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = getInternalApiUrl();

  try {
    const res = await fetch(`${apiUrl}/api/v1/jobs/public/${slug}`, {
      next: { revalidate: 3600, tags: [`job-${slug}`] },
    });

    if (!res.ok) {
      return {
        title: "Cơ hội việc làm - AI Talent Suite",
        description: "Khám phá các vị trí tuyển dụng hấp dẫn tại AI Talent Suite.",
      };
    }

    const job = await res.json();
    const title = `${job.title} — Lương: ${job.salary_range || "Thỏa thuận"} | AI Talent Suite`;
    const description = `${job.description?.slice(0, 160) || "Cơ hội việc làm hấp dẫn"}. Địa điểm: ${
      job.location || "Việt Nam"
    } | Phòng ban: ${job.department || "Kỹ thuật"}. Nộp CV Quick Apply trong 30 giây!`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-recruiting-staff.vercel.app";
    const jobUrl = `${siteUrl}/jobs/${job.slug}`;
    const ogImage = job.banner_url || `${siteUrl}/favicon.ico`;

    return {
      title,
      description,
      alternates: {
        canonical: jobUrl,
      },
      openGraph: {
        title,
        description,
        url: jobUrl,
        siteName: "AI Talent Suite — Nền Tảng Tuyển Dụng Thông Minh",
        locale: "vi_VN",
        type: "article",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: job.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Cơ hội việc làm - AI Talent Suite",
    };
  }
}

// 4. Server Component nạp dữ liệu và xuất mã nguồn HTML hoàn chỉnh + JSON-LD Google Jobs
export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const apiUrl = getInternalApiUrl();

  let job = null;
  try {
    const res = await fetch(`${apiUrl}/api/v1/jobs/public/${slug}`, {
      next: { revalidate: 3600, tags: [`job-${slug}`] },
    });
    if (res.ok) {
      job = await res.json();
    }
  } catch (error) {
    console.error("Lỗi khi tải chi tiết JD từ máy chủ:", error);
  }

  if (!job) {
    notFound();
  }

  // 5. Cấu trúc Schema JSON-LD chuẩn Google Jobs (Google Search Indexing)
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.created_at || "2026-10-01",
    validThrough: job.deadline || undefined,
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name || "AI Talent Suite Enterprise",
      sameAs: "https://ai-recruiting-staff.vercel.app",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || "Hà Nội",
        addressCountry: "VN",
      },
    },
    baseSalary: job.salary_range
      ? {
          "@type": "MonetaryAmount",
          currency: "VND",
          value: {
            "@type": "QuantitativeValue",
            value: job.salary_range,
            unitText: "MONTH",
          },
        }
      : undefined,
  };

  return (
    <>
      {/* Schema JSON-LD cho Google Jobs Bot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Giao diện người dùng tương tác */}
      <JobDetailClient job={job} />
    </>
  );
}
