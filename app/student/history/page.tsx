"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, History } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useRequireAuth } from "@/lib/authContext";

interface HistoryRecord {
  id: string;
  subject: string;
  date: string;
  scanTime: string;
  status: "hadir" | "terlambat" | "izin" | "sakit" | "alpha";
  notes?: string;
}

export default function StudentHistoryPage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("student");
  const studentId = currentUser?.id || "std-1001";

  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students?id=${studentId}`);
        const data = await res.json();
        if (data.success && data.student) {
          if (data.student.className && data.student.className !== "Kelas") {
            setClassName(data.student.className);
          }
          if (data.student.history) {
            setRecords(data.student.history);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch personal history", e);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) {
      fetchHistory();
    }
  }, [studentId]);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/student"
          className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#191E24] tracking-tight">
            Riwayat Absensi Saya
          </h1>
          <p className="text-xs text-[#7B868F]">
            Catatan kehadiran pribadi{className ? ` di Kelas ${className}` : ""}
          </p>
        </div>
      </div>

      <div className="saas-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E8]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7B868F] flex items-center gap-1.5">
            <History className="h-4 w-4 text-[#C2B535]" />
            Daftar Presensi
          </span>
          <span className="text-xs font-semibold text-[#7B868F]">
            {records.length} Sesi
          </span>
        </div>

        <div className="divide-y divide-[#E7E8E8]/70">
          {loading ? (
            <p className="text-center py-8 text-xs text-[#7B868F]">
              Memuat riwayat...
            </p>
          ) : records.length === 0 ? (
            <p className="text-center py-8 text-xs text-[#7B868F]">
              Belum ada riwayat absensi.
            </p>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#F5F5F5]/60 rounded-xl px-2 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-[#191E24]">
                    {rec.subject}
                  </h4>
                  <p className="text-xs text-[#7B868F] mt-0.5">
                    {rec.date} • {rec.scanTime} WIB
                    {rec.notes ? ` • ${rec.notes}` : ""}
                  </p>
                </div>

                <StatusBadge status={rec.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
