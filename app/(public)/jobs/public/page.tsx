import { redirect } from "next/navigation";

// Tự động chuyển hướng vĩnh viễn (301) về route Cổng việc làm chuẩn /careers để tránh trùng lặp nội dung
export default function DeprecatedJobsPublicPage() {
  redirect("/careers");
}
