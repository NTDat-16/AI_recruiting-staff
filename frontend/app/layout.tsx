import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Recruiting Platform - Tuyển Dụng Thông Minh",
  description: "Nền tảng website tuyển dụng ứng dụng AI hỗ trợ sàng lọc CV, phỏng vấn và đánh giá",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl">🤖</span>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  AI Recruiting
                </span>
              </Link>
              <nav className="hidden md:flex space-x-1 text-sm font-medium text-slate-600">
                <Link href="/" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">
                  Dashboard
                </Link>
                <Link href="/jobs" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">
                  Tin Tuyển Dụng
                </Link>
                <Link href="/candidates" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">
                  Ứng Viên & Pipeline
                </Link>
                <Link href="/interviews" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">
                  Lịch Phỏng Vấn
                </Link>
                <Link href="/evaluations" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">
                  Đánh Giá & Transcript
                </Link>
                <Link href="/reports" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900">
                  Báo Cáo
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/jobs/public"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
              >
                🌐 Cổng Ứng Viên
              </Link>
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                HR
              </div>
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          Nền tảng website tuyển dụng ứng dụng AI • Phiên bản 1.0 (FastAPI + Next.js + Celery)
        </footer>
      </body>
    </html>
  );
}
