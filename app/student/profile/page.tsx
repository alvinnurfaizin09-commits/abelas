"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award } from "lucide-react";
import AttendanceChart from "@/components/AttendanceChart";
import { useRequireAuth } from "@/lib/authContext";

export default function StudentProfilePage() {
  const { currentUser, isLoading } = useRequireAuth("student");
  const studentName = currentUser?.name || "Siswa";
  const studentNumber = currentUser?.student_number || "-";

  const [className, setClassName] = useState<string | null>(null);
  const [stats, setStats] = useState({
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    attendanceRate: 100,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/students?id=${currentUser?.id || "std-1001"}`);
        const data = await res.json();
        if (data.success && data.student) {
          setClassName(data.student.className || null);
          setStats({
            hadir: data.student.stats?.hadir || 0,
            terlambat: data.student.stats?.terlambat || 0,
            izin: data.student.stats?.izin || 0,
            sakit: data.student.stats?.sakit || 0,
            alpha: data.student.stats?.alpha || 0,
            attendanceRate: data.student.stats?.attendanceRate ?? 100,
          });
        }
      } catch (e) {
        console.warn("Failed to fetch student profile", e);
      }
    };
    if (currentUser?.id) {
      fetchProfile();
    }
  }, [currentUser]);

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
            Profil Siswa
          </h1>
          <p className="text-xs text-[#7B868F]">
            Informasi dan statistik kehadiran pribadi
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="saas-card p-6 text-center space-y-4">
        <div className="h-16 w-16 rounded-3xl bg-[#191E24] text-white font-bold text-xl flex items-center justify-center mx-auto shadow-xs">
          {studentName.charAt(0)}
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#191E24]">
            {studentName}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                className
                  ? "bg-[#F5F5F5] text-[#191E24] border-[#E7E8E8]"
                  : "bg-[#FAF7F2] text-[#786134] border-[#EADBCA]"
              }`}
            >
              {className ? `Kelas ${className}` : "Belum Ada Kelas"}
            </span>
            <span className="text-xs text-[#7B868F] font-mono">
              NIS: {studentNumber}
            </span>
          </div>
        </div>

        {/* Attendance Rate Card */}
        <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs font-semibold text-[#7B868F] uppercase tracking-wider">
              Attendance Rate
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-[#191E24]">
              {stats.attendanceRate}%
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white border border-[#E7E8E8] flex items-center justify-center text-[#7B868F] shadow-2xs">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="saas-card p-4 text-center">
          <span className="text-xs font-semibold text-[#7B868F]">Hadir</span>
          <p className="text-2xl font-bold text-[#3B5A42] mt-1">{stats.hadir}</p>
        </div>
        <div className="saas-card p-4 text-center">
          <span className="text-xs font-semibold text-[#7B868F]">Terlambat</span>
          <p className="text-2xl font-bold text-[#786134] mt-1">{stats.terlambat}</p>
        </div>
        <div className="saas-card p-4 text-center">
          <span className="text-xs font-semibold text-[#7B868F]">Izin</span>
          <p className="text-2xl font-bold text-[#3E5266] mt-1">{stats.izin}</p>
        </div>
        <div className="saas-card p-4 text-center">
          <span className="text-xs font-semibold text-[#7B868F]">Sakit</span>
          <p className="text-2xl font-bold text-[#584D67] mt-1">{stats.sakit}</p>
        </div>
        <div className="saas-card p-4 text-center col-span-2 sm:col-span-2">
          <span className="text-xs font-semibold text-[#7B868F]">Alpha</span>
          <p className="text-2xl font-bold text-[#7B3F3E] mt-1">{stats.alpha}</p>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <AttendanceChart />
    </div>
  );
}
