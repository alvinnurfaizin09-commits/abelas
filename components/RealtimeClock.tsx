"use client";

import { useEffect, useState } from "react";
import { Clock, Calendar, Sparkles } from "lucide-react";

interface RealtimeClockProps {
  className?: string;
  isExtraDayActive?: boolean;
}

export default function RealtimeClock({
  className = "",
  isExtraDayActive = false,
}: RealtimeClockProps) {
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [dayName, setDayName] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTime(`${hours}:${minutes}:${seconds}`);

      const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
      ];
      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];

      const currentDay = days[now.getDay()];
      setDayName(currentDay);
      const dateNum = String(now.getDate()).padStart(2, "0");
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      setDateStr(`${dateNum} ${monthName} ${year}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-xl shadow-indigo-950/20 border border-slate-700/50 ${className}`}
    >
      {/* Decorative background glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Date & Day */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md text-slate-200 border border-white/10">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              {dayName || "..."}
            </span>
            {isExtraDayActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Hari Tambahan
              </span>
            )}
          </div>
          <p className="text-xl font-bold tracking-tight text-white sm:text-2xl pt-1">
            {dateStr || "Memuat tanggal..."}
          </p>
        </div>

        {/* Right: Digital Clock */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between border-t border-white/10 sm:border-t-0 pt-3 sm:pt-0">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400 animate-pulse" />
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-emerald-300 drop-shadow-sm">
              {time || "--:--:--"}
            </div>
          </div>
          <span className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">
            Waktu Indonesia Barat (WIB)
          </span>
        </div>
      </div>
    </div>
  );
}
