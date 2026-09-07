"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronRight, X } from "lucide-react";
import { useRequireAuth } from "@/lib/authContext";

interface SessionSummary {
  id: string;
  subject: string;
  date: string;
  formattedDate: string;
  startTime: string;
  endTime: string;
  presentCount: number;
  totalCount: number;
  rate: number;
}

export default function AdminHistoryPage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const [historyList] = useState<SessionSummary[]>([
    {
      id: "ATT-20260906-001",
      subject: "Matematika",
      date: "2026-09-06",
      formattedDate: "06 Sep",
      startTime: "07:00",
      endTime: "07:05",
      presentCount: 32,
      totalCount: 36,
      rate: 89,
    },
    {
      id: "ATT-20260905-001",
      subject: "Bahasa Indonesia",
      date: "2026-09-05",
      formattedDate: "05 Sep",
      startTime: "08:00",
      endTime: "08:15",
      presentCount: 34,
      totalCount: 36,
      rate: 94,
    },
    {
      id: "ATT-20260904-001",
      subject: "Fisika",
      date: "2026-09-04",
      formattedDate: "04 Sep",
      startTime: "07:00",
      endTime: "07:10",
      presentCount: 30,
      totalCount: 36,
      rate: 83,
    },
    {
      id: "ATT-20260903-001",
      subject: "Kimia",
      date: "2026-09-03",
      formattedDate: "03 Sep",
      startTime: "09:00",
      endTime: "09:10",
      presentCount: 33,
      totalCount: 36,
      rate: 92,
    },
    {
      id: "ATT-20260902-001",
      subject: "Biologi",
      date: "2026-09-02",
      formattedDate: "02 Sep",
      startTime: "07:30",
      endTime: "07:40",
      presentCount: 35,
      totalCount: 36,
      rate: 97,
    },
  ]);

  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#191E24] tracking-tight">
            Riwayat Absensi
          </h1>
          <p className="text-xs text-[#7B868F]">
            Rekapitulasi kehadiran kelas XI-D berdasarkan tanggal
          </p>
        </div>
      </div>

      {/* Month Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#7B868F] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#7B868F]" />
            September 2026
          </span>
          <span className="text-xs font-medium text-[#7B868F]">
            {historyList.length} Sesi Terlaksana
          </span>
        </div>

        <div className="space-y-2.5">
          {historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedSession(item)}
              className="saas-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-[#191E24] hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] flex flex-col items-center justify-center font-bold text-xs text-[#191E24] flex-shrink-0">
                  <span className="text-xs leading-none">{item.formattedDate.split(" ")[0]}</span>
                  <span className="text-[10px] text-[#7B868F] uppercase leading-none mt-0.5">
                    {item.formattedDate.split(" ")[1]}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#191E24]">
                    {item.subject}
                  </h4>
                  <p className="text-xs text-[#7B868F] flex items-center gap-2 mt-0.5">
                    <span>{item.presentCount} hadir</span>
                    <span>•</span>
                    <span className="font-mono">{item.startTime} – {item.endTime}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-bold text-[#191E24] block">
                    {item.rate}%
                  </span>
                  <span className="text-[11px] font-medium text-[#3B5A42] block">
                    Kehadiran
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#7B868F]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[24px] bg-white border border-[#E7E8E8] shadow-xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E8]">
              <div>
                <h3 className="text-base font-bold text-[#191E24]">
                  Detail Sesi: {selectedSession.subject}
                </h3>
                <p className="text-xs text-[#7B868F] mt-0.5">
                  ID: {selectedSession.id} • {selectedSession.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-xl text-[#7B868F] hover:bg-[#F5F5F5] hover:text-[#191E24]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8]">
                <span className="text-[11px] text-[#7B868F] font-semibold">Total Kehadiran</span>
                <p className="text-lg font-bold text-[#191E24] mt-0.5">
                  {selectedSession.presentCount} / {selectedSession.totalCount}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8]">
                <span className="text-[11px] text-[#7B868F] font-semibold">Rasio Kehadiran</span>
                <p className="text-lg font-bold text-[#8C7F24] mt-0.5">
                  {selectedSession.rate}%
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#E7E8E8]">
                <span className="text-[#7B868F]">Waktu Sesi:</span>
                <span className="font-semibold text-[#191E24]">{selectedSession.startTime} – {selectedSession.endTime} WIB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E7E8E8]">
                <span className="text-[#7B868F]">Kelas:</span>
                <span className="font-semibold text-[#191E24]">XI-D</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E7E8E8]">
                <span className="text-[#7B868F]">Status Sesi:</span>
                <span className="font-semibold text-[#3B5A42]">Selesai / Terverifikasi</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full saas-btn bg-[#191E24] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
