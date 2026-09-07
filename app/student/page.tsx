"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  Clock,
  Percent,
  Calendar,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useRequireAuth } from "@/lib/authContext";

interface StudentHistoryItem {
  id: string;
  subject: string;
  date: string;
  status: "hadir" | "terlambat" | "izin" | "sakit" | "alpha";
  scanTime: string;
}

export default function StudentDashboardPage() {
  const { currentUser, isLoading } = useRequireAuth("student");
  const studentId = currentUser?.id || "std-1001";
  const studentName = currentUser?.name || "Siswa";

  const [hasAttendedToday, setHasAttendedToday] = useState<boolean>(false);
  const [todayDetails, setTodayDetails] = useState<{
    subject: string;
    time: string;
    scanTime: string;
    status: string;
  } | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [className, setClassName] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<StudentHistoryItem[]>([]);

  const loadStudentInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/students?id=${studentId}`);
      const data = await res.json();
      if (data.success && data.student) {
        setAttendanceRate(data.student.stats?.attendanceRate ?? 100);
        if (data.student.className && data.student.className !== "Kelas") {
          setClassName(data.student.className);
        } else {
          setClassName(null);
        }

        if (data.student.history && data.student.history.length > 0) {
          setRecentHistory(data.student.history.slice(0, 3));
          const latest = data.student.history[0];
          setHasAttendedToday(true);
          setTodayDetails({
            subject: latest.subject,
            time: "07:00",
            scanTime: latest.scanTime || "07:00",
            status: latest.status,
          });
        } else {
          setRecentHistory([]);
          setHasAttendedToday(false);
          setTodayDetails(null);
        }
      }
    } catch (e) {
      console.warn("Failed to load student info", e);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudentInfo();
  }, [loadStudentInfo]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#191E24] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: "Halo Alvin" without emojis */}
      <Header greeting="Halo" userName={studentName} />

      {/* Unassigned Class Guidance Banner */}
      {!className && (
        <div className="saas-card p-5 border border-[#EADBCA] bg-[#FAF7F2] flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-[#786134] text-white flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#786134]">
              Belum Terdaftar di Kelas
            </h3>
            <p className="text-xs text-[#786134]/90 font-medium mt-0.5 leading-relaxed">
              Kelas kamu akan otomatis ditentukan saat pertama kali melakukan scan QR Code dari layar guru di ruang kelas.
            </p>
          </div>
        </div>
      )}

      {/* Card Besar: "Absensi Hari Ini" */}
      <div className="saas-card p-6 sm:p-7 space-y-5 border border-[#E7E8E8]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7B868F] flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#7B868F]" />
            Absensi Hari Ini
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              className
                ? "text-[#191E24] bg-[#F5F5F5] border-[#E7E8E8]"
                : "text-[#786134] bg-[#FAF7F2] border-[#EADBCA]"
            }`}
          >
            {className ? `Kelas ${className}` : "Belum Ada Kelas"}
          </span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#191E24] tracking-tight">
            {todayDetails?.subject || (className ? "Sesi Pelajaran Aktif" : "Sesi Pelajaran")}
          </h2>
          <p className="text-sm font-medium text-[#7B868F] mt-0.5">
            {todayDetails?.time
              ? `Jadwal: ${todayDetails.time} WIB`
              : (className ? "Buka kamera untuk scan kehadiran" : "Scan QR guru untuk otomatis masuk kelas dan absensi")}
          </p>
        </div>

        {/* Status indicator */}
        <div className="pt-1">
          {hasAttendedToday && todayDetails ? (
            <div className="p-4 rounded-2xl bg-[#F2F6F3] border border-[#D6E2D8] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#3B5A42] text-white flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#3B5A42]">
                    Sudah Hadir
                  </p>
                  <p className="text-[11px] text-[#55705C] font-medium">
                    Tercatat pada {todayDetails.scanTime} WIB
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-semibold tracking-tight bg-white border border-[#D6E2D8] text-[#3B5A42] px-2.5 py-1 rounded-full">
                {todayDetails.status === "hadir" ? "Hadir" : "Terlambat"}
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCA] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#786134] text-white flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#786134]">
                    Belum Absen
                  </p>
                  <p className="text-[11px] text-[#786134]/80 font-medium">
                    Silakan scan QR code di layar proyektor kelas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Big Button: "Scan QR" */}
        <Link
          href="/student/scan"
          className="w-full saas-btn bg-[#191E24] hover:bg-black text-white text-sm font-semibold gap-2.5 shadow-2xs py-3.5"
        >
          <QrCode className="h-5 w-5 text-[#C2B535]" />
          <span>Scan QR</span>
        </Link>
      </div>

      {/* Attendance Rate Widget */}
      <div className="saas-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] flex items-center justify-center text-[#191E24]">
            <Percent className="h-4 w-4 text-[#7B868F]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#7B868F] uppercase tracking-wide">
              Attendance Rate
            </p>
            <p className="text-2xl font-bold text-[#191E24] mt-0.5">
              {attendanceRate}%
            </p>
          </div>
        </div>

        <Link
          href="/student/profile"
          className="text-xs font-semibold text-[#191E24] hover:text-[#7B868F] flex items-center gap-1"
        >
          <span>Detail Statistik</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Riwayat Terakhir */}
      <div className="saas-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E7E8E8]">
          <h3 className="text-sm font-bold text-[#191E24]">
            Riwayat Terakhir
          </h3>
          <Link
            href="/student/history"
            className="text-xs font-semibold text-[#7B868F] hover:text-[#191E24]"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="divide-y divide-[#E7E8E8]/70">
          {recentHistory.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#7B868F]">
              Belum ada riwayat absensi.
            </p>
          ) : (
            recentHistory.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-[#191E24]">
                    {item.subject}
                  </p>
                  <p className="text-[11px] text-[#7B868F] mt-0.5">
                    {item.date} • {item.scanTime} WIB
                  </p>
                </div>

                <StatusBadge status={item.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
