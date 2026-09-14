"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StudentRow from "@/components/StudentRow";
import AttendanceProgress from "@/components/AttendanceProgress";
import CreateSessionModal from "@/components/CreateSessionModal";
import ManualAttendanceModal from "@/components/ManualAttendanceModal";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  Plus,
  QrCode,
  History,
  BarChart3,
  Search,
  Clock,
  Settings,
  GraduationCap,
} from "lucide-react";
import { AttendanceStatus, ClassItem } from "@/lib/db";
import { useRequireAuth } from "@/lib/authContext";

interface StudentItem {
  id: string;
  name: string;
  studentNumber: string;
  className?: string;
  status: AttendanceStatus | "belum_hadir";
  scanTime: string;
  notes?: string;
}

export default function AdminDashboardPage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("cls-xid");
  const [scheduleSettings, setScheduleSettings] = useState<{
    startTime: string;
    lateThresholdTime: string;
  }>({
    startTime: "07:00",
    lateThresholdTime: "07:30",
  });

  const [stats, setStats] = useState({
    totalStudents: 0,
    hadirToday: 0,
    belumHadir: 0,
    attendanceRate: 0,
  });

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Settings & Classes
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setScheduleSettings({
            startTime: data.settings.startTime || "07:00",
            lateThresholdTime: data.settings.lateThresholdTime || "07:30",
          });
        }
      })
      .catch(console.warn);

    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.classes)) {
          setClasses(data.classes);
        }
      })
      .catch(console.warn);
  }, []);

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        selectedClassId === "all"
          ? "/api/students?class_id=all"
          : `/api/students?class_id=${selectedClassId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setStats({
          totalStudents: data.totalStudents || 0,
          hadirToday: data.hadirTotal || 0,
          belumHadir: data.belumHadirTotal || 0,
          attendanceRate: data.attendanceRate || 0,
        });
        if (data.session) {
          setActiveSessionId(data.session.id);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch students", e);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Filter & Search
  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.studentNumber.includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "hadir") return st.status === "hadir";
    if (statusFilter === "terlambat") return st.status === "terlambat";
    if (statusFilter === "izin") return st.status === "izin";
    if (statusFilter === "sakit") return st.status === "sakit";
    if (statusFilter === "alpha") return st.status === "alpha" || st.status === "belum_hadir";
    return true;
  });

  const filterTabs = [
    { id: "all", label: "Semua" },
    { id: "hadir", label: "Hadir" },
    { id: "terlambat", label: "Terlambat" },
    { id: "izin", label: "Izin" },
    { id: "sakit", label: "Sakit" },
    { id: "alpha", label: "Alpha" },
  ];

  if (authLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#191E24] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header greeting="Selamat Pagi" userName={currentUser.name} />

      {/* Schedule & Late Rule Info Banner */}
      <div className="rounded-2xl p-4 bg-white border border-[#E7E8E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#F5F5F5] border border-[#E7E8E8] flex items-center justify-center text-[#191E24] flex-shrink-0">
            <Clock className="h-4 w-4 text-[#8C7F24]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-[#191E24]">
                Aturan Jam Masuk & Batas Terlambat
              </p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F2F6F3] text-[#3B5A42] border border-[#D6E2D8]">
                Aktif
              </span>
            </div>
            <p className="text-xs text-[#7B868F] mt-0.5">
              Mulai: <span className="font-semibold text-[#191E24]">{scheduleSettings.startTime} WIB</span> • Batas Tepat Waktu: <span className="font-semibold text-[#191E24]">{scheduleSettings.lateThresholdTime} WIB</span> (Scan setelah jam ini otomatis Terlambat)
            </p>
          </div>
        </div>

        <Link
          href="/admin/schedule"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#EAEAEA] text-xs font-semibold text-[#191E24] transition-colors self-start sm:self-auto flex-shrink-0"
        >
          <Settings className="h-3.5 w-3.5 text-[#7B868F]" />
          <span>Ubah Jam Masuk</span>
        </Link>
      </div>

      {/* Class Switcher for Admin */}
      {classes.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[#7B868F] flex items-center gap-1 uppercase tracking-wider pl-1">
            <GraduationCap className="h-3.5 w-3.5 text-[#C2B535]" /> Kelas:
          </span>
          <button
            onClick={() => setSelectedClassId("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedClassId === "all"
                ? "bg-[#191E24] text-white border-[#191E24] shadow-xs"
                : "bg-white text-[#7B868F] border-[#E7E8E8] hover:text-[#191E24]"
            }`}
          >
            Semua Kelas
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedClassId === c.id
                  ? "bg-[#191E24] text-white border-[#191E24] shadow-xs"
                  : "bg-white text-[#7B868F] border-[#E7E8E8] hover:text-[#191E24]"
              }`}
            >
              Kelas {c.name}
            </button>
          ))}
        </div>
      )}

      {/* 4 Big Stat Cards (20-24px rounded corners) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Siswa"
          value={selectedClassId === "all" ? stats.totalStudents : `${stats.totalStudents} / 40`}
          subtitle={
            selectedClassId === "all"
              ? "Seluruh Kelas"
              : `Kelas ${classes.find((c) => c.id === selectedClassId)?.name || "XI-D"} (Maks 40)`
          }
          icon={<Users className="h-4 w-4 text-[#191E24]" />}
        />
        <StatCard
          title="Hadir Hari Ini"
          value={stats.hadirToday}
          subtitle="Tercatat masuk"
          icon={<UserCheck className="h-4 w-4 text-[#3B5A42]" />}
        />
        <StatCard
          title="Belum Hadir"
          value={stats.belumHadir}
          subtitle="Siswa"
          icon={<UserX className="h-4 w-4 text-[#7B3F3E]" />}
        />
        <StatCard
          title="Kehadiran"
          value={`${stats.attendanceRate}%`}
          subtitle="Rasio hari ini"
          icon={<Percent className="h-4 w-4 text-[#8C7F24]" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-[#7B868F] uppercase tracking-wider">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="saas-btn bg-[#191E24] text-white hover:bg-black text-xs font-semibold gap-2 shadow-2xs"
          >
            <Plus className="h-4 w-4 text-[#C2B535]" />
            <span>Buat Absensi</span>
          </button>

          <Link
            href={`/admin/qr?id=${activeSessionId}`}
            className="saas-btn bg-white border border-[#E7E8E8] text-[#191E24] hover:border-[#191E24] text-xs font-semibold gap-2 shadow-2xs"
          >
            <QrCode className="h-4 w-4 text-[#191E24]" />
            <span>Tampilkan QR</span>
          </Link>

          <Link
            href="/admin/students"
            className="saas-btn bg-white border border-[#E7E8E8] text-[#191E24] hover:border-[#191E24] text-xs font-semibold gap-2 shadow-2xs"
          >
            <Users className="h-4 w-4 text-[#7B868F]" />
            <span>Daftar Siswa</span>
          </Link>

          <Link
            href="/admin/history"
            className="saas-btn bg-white border border-[#E7E8E8] text-[#191E24] hover:border-[#191E24] text-xs font-semibold gap-2 shadow-2xs"
          >
            <History className="h-4 w-4 text-[#7B868F]" />
            <span>Riwayat</span>
          </Link>

          <Link
            href="/admin/profile"
            className="saas-btn bg-white border border-[#E7E8E8] text-[#191E24] hover:border-[#191E24] text-xs font-semibold gap-2 shadow-2xs col-span-2 sm:col-span-1"
          >
            <BarChart3 className="h-4 w-4 text-[#7B868F]" />
            <span>Statistik</span>
          </Link>
        </div>
      </div>

      {/* Attendance Today Section */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#191E24]">
              Attendance Today
            </h3>
            <p className="text-xs text-[#7B868F] mt-0.5">
              Matematika • 06 September 2026
            </p>
          </div>

          <Link
            href={`/admin/qr?id=${activeSessionId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#EAEAEA] text-xs font-semibold text-[#191E24] transition-colors self-start sm:self-auto"
          >
            <QrCode className="h-3.5 w-3.5 text-[#191E24]" />
            <span>Buka Layar QR</span>
          </Link>
        </div>

        {/* Attendance Progress Bar */}
        <AttendanceProgress
          presentCount={stats.hadirToday}
          totalCount={stats.totalStudents}
        />

        {/* Search & Filter Bar */}
        <div className="pt-2 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-2xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
            <Search className="h-4 w-4 text-[#7B868F] absolute left-3 top-3" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#191E24] text-white shadow-2xs"
                    : "bg-[#F5F5F5] text-[#7B868F] hover:bg-[#EAEAEA] hover:text-[#191E24]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-2 pt-1">
          {loading ? (
            <p className="text-center py-8 text-xs text-[#7B868F]">
              Memuat data kehadiran...
            </p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center py-8 text-xs text-[#7B868F]">
              Tidak ada siswa yang sesuai pencarian atau filter.
            </p>
          ) : (
            filteredStudents.map((st) => (
              <StudentRow
                key={st.id}
                name={st.name}
                studentNumber={st.studentNumber}
                time={st.scanTime}
                status={st.status}
                notes={st.notes}
                isClickable={true}
                onClick={() => setSelectedStudentForEdit(st)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={isCreateModalOpen}
        defaultClassId={selectedClassId !== "all" ? selectedClassId : "cls-xid"}
        onClose={() => setIsCreateModalOpen(false)}
        onSessionCreated={() => loadStudentData()}
      />

      {/* Manual Status Override Modal */}
      <ManualAttendanceModal
        isOpen={!!selectedStudentForEdit}
        student={selectedStudentForEdit}
        sessionId={activeSessionId}
        onClose={() => setSelectedStudentForEdit(null)}
        onStatusUpdated={() => loadStudentData()}
      />
    </div>
  );
}
