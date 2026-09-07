"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Settings } from "lucide-react";
import AttendanceChart from "@/components/AttendanceChart";
import { useRequireAuth } from "@/lib/authContext";

export default function AdminProfilePage() {
  const { currentUser, isLoading } = useRequireAuth("admin");

  return (
    <div className="space-y-6 max-w-xl mx-auto">
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
            Profil & Statistik Guru
          </h1>
          <p className="text-xs text-[#7B868F]">
            Pengurus Kelas & Guru Matematika
          </p>
        </div>
      </div>

      {/* Admin Profile Card */}
      <div className="saas-card p-6 text-center space-y-4">
        <div className="h-16 w-16 rounded-3xl bg-[#191E24] text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xs">
          <Shield className="h-8 w-8 text-[#EEDB8A]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#191E24]">
            {currentUser?.name || "Alvin"}
          </h2>
          <p className="text-xs text-[#7B868F] mt-0.5">
            NIP: 198809062020121001 • Guru Wali Kelas XI-D
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8]">
            <span className="text-[11px] font-semibold text-[#7B868F]">Kelas</span>
            <p className="text-base font-bold text-[#191E24] mt-0.5">XI-D</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8]">
            <span className="text-[11px] font-semibold text-[#7B868F]">Siswa</span>
            <p className="text-base font-bold text-[#191E24] mt-0.5">36</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8]">
            <span className="text-[11px] font-semibold text-[#7B868F]">Kehadiran</span>
            <p className="text-base font-bold text-[#3B5A42] mt-0.5">93%</p>
          </div>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <AttendanceChart />

      {/* Quick Settings Link */}
      <div className="saas-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] flex items-center justify-center text-[#191E24]">
            <Settings className="h-4 w-4 text-[#7B868F]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#191E24]">Pengaturan Kelas & Jadwal</h4>
            <p className="text-xs text-[#7B868F]">Kelola hari kerja & aturan jam masuk</p>
          </div>
        </div>
        <Link
          href="/admin/classes"
          className="saas-btn bg-[#191E24] hover:bg-black text-white text-xs px-4 py-2"
        >
          Buka
        </Link>
      </div>
    </div>
  );
}
