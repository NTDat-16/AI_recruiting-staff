"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface SchedulePickerProps {
  onSchedule: (data: {
    scheduled_time: string;
    duration_minutes: number;
    format: "online" | "offline";
    location?: string;
  }) => void;
  loading?: boolean;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  onSchedule,
  loading = false,
}) => {
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(45);
  const [format, setFormat] = useState<"online" | "offline">("online");
  const [location, setLocation] = useState<string>("Phòng họp 301 - Tòa nhà Innovation");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    const scheduled_time = `${date}T${time}:00`;
    onSchedule({
      scheduled_time,
      duration_minutes: duration,
      format,
      location: format === "offline" ? location : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày phỏng vấn</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Khung giờ</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {["08:30", "09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Thời lượng</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value={30}>30 phút</option>
            <option value={45}>45 phút (Chuẩn)</option>
            <option value={60}>60 phút</option>
            <option value={90}>90 phút</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Hình thức</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setFormat("online")}
              className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                format === "online"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              💻 Trực tuyến (Meet/Zoom)
            </button>
            <button
              type="button"
              onClick={() => setFormat("offline")}
              className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                format === "offline"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              🏢 Trực tiếp (Văn phòng)
            </button>
          </div>
        </div>
      </div>

      {format === "offline" && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Địa điểm phỏng vấn</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Nhập phòng họp, địa chỉ công ty..."
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={loading || !date}>
          {loading ? "Đang lên lịch..." : "Xác nhận & Gửi lời mời"}
        </Button>
      </div>
    </form>
  );
};
