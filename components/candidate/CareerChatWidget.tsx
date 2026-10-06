"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  recommendedJobs?: Array<{
    id: string;
    title: string;
    department?: string;
    location?: string;
    salary_range?: string;
    slug?: string;
  }>;
}

export const CareerChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Xin chào! 👋 Tôi là Trợ Lý Tuyển Dụng AI. Bạn đang quan tâm đến cơ hội nghề nghiệp nào hoặc cần giải đáp thông tin gì về quy trình phỏng vấn?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply,
          recommendedJobs: data.recommended_jobs,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("Chat request failed");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Xin lỗi, hiện tại tôi đang gặp chút gián đoạn kết nối. Bạn có thể tham khảo trực tiếp danh sách vị trí trên trang chủ Cổng Tuyển Dụng nhé!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Công ty đang mở tuyển những vị trí nào?",
    "Quy trình nộp đơn Quick Apply thế nào?",
    "Cần chuẩn bị gì khi phỏng vấn?",
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm rounded-full shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all cursor-pointer"
        >
          <span className="text-xl animate-bounce">💬</span>
          <span>Tư vấn nghề nghiệp AI</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Trợ Lý Tuyển Dụng AI</h3>
                <p className="text-[11px] text-indigo-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Hỗ trợ ứng viên 24/7
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-slate-100 text-slate-800 rounded-bl-xs whitespace-pre-line"
                  }`}
                >
                  {m.text}
                </div>

                {/* Render recommended jobs if any */}
                {m.recommendedJobs && m.recommendedJobs.length > 0 && (
                  <div className="mt-2.5 w-full space-y-1.5 pl-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Vị trí đề xuất cho bạn:
                    </p>
                    {m.recommendedJobs.map((j) => (
                      <Link
                        key={j.id}
                        href={`/jobs/${j.slug || j.id}`}
                        className="block p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-colors"
                      >
                        <p className="font-semibold text-indigo-900">{j.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          {j.department && <span>🏢 {j.department}</span>}
                          {j.salary_range && <span className="font-medium text-emerald-600">💰 {j.salary_range}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Trợ lý đang phản hồi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về vị trí, kỹ năng, phỏng vấn..."
                disabled={loading}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
