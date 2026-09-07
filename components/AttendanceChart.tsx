"use client";

import React from "react";

interface AttendanceChartProps {
  data?: { day: string; rate: number }[];
}

export default function AttendanceChart({
  data = [
    { day: "Sen", rate: 100 },
    { day: "Sel", rate: 95 },
    { day: "Rab", rate: 90 },
    { day: "Kam", rate: 92 },
    { day: "Jum", rate: 88 },
    { day: "Sab", rate: 96 },
  ],
}: AttendanceChartProps) {
  return (
    <div className="saas-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-[#191E24]">Tren Kehadiran Mingguan</h4>
          <p className="text-xs text-[#7B868F]">Persentase hadir per hari</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F2F5F2] text-[#3B5A42] border border-[#D6E2D8]">
          Rata-rata 93%
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-[10px] font-medium text-[#7B868F]">{item.rate}%</span>
            <div className="w-full max-w-[26px] bg-[#F5F5F5] rounded-t-lg h-full flex items-end overflow-hidden">
              <div
                className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-[#9EB47B] to-[#8C7F24]"
                style={{ height: `${item.rate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#7B868F]">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
