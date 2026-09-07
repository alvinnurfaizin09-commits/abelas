"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StudentRow from "@/components/StudentRow";
import ManualAttendanceModal from "@/components/ManualAttendanceModal";
import AddStudentModal from "@/components/AddStudentModal";
import {
  ArrowLeft,
  Search,
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Filter,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { AttendanceStatus, ClassItem } from "@/lib/db";
import { useRequireAuth } from "@/lib/authContext";

interface StudentItem {
  id: string;
  name: string;
  studentNumber: string;
  email?: string;
  class_id?: string;
  className?: string;
  status: AttendanceStatus | "belum_hadir";
  scanTime: string;
  notes?: string;
}

export default function AdminStudentsPage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("cls-xid");
  const [activeSessionId, setActiveSessionId] = useState<string>("ATT-20260906-001");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load Classes
  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        setClasses(data.classes);
      }
    } catch (e) {
      console.warn("Failed to fetch classes", e);
    }
  }, []);

  // Load Students for selected class
  const loadStudents = useCallback(async () => {
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
        if (data.classes && classes.length === 0) {
          setClasses(data.classes);
        }
        if (data.session) {
          setActiveSessionId(data.session.id);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch students", e);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, classes.length]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Handle student delete
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus data siswa "${studentName}" dari sistem? Tindakan ini akan mengosongkan 1 kuota kelas.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ text: `Siswa "${studentName}" berhasil dihapus. Kuota kelas diperbarui.`, type: "success" });
        loadStudents();
      } else {
        setToast({ text: data.error || "Gagal menghapus siswa", type: "error" });
      }
    } catch (err: unknown) {
      setToast({ text: (err as Error).message, type: "error" });
    }
  };

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

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const maxCapacity = 40;
  const isAllView = selectedClassId === "all";
  const classStudentCount = students.length;
  const capacityLeft = Math.max(0, maxCapacity - classStudentCount);
  const isClassFull = !isAllView && classStudentCount >= maxCapacity;
  const capacityPercent = Math.min(100, Math.round((classStudentCount / maxCapacity) * 100));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#191E24] tracking-tight">
              Manajemen Siswa Per Kelas
            </h1>
            <p className="text-xs text-[#7B868F]">
              Setiap kelas memiliki data mandiri dengan kapasitas maksimal 40 murid
            </p>
          </div>
        </div>

        {/* Action Button: Tambah Siswa */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={isClassFull}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-xs self-start sm:self-auto ${
            isClassFull
              ? "bg-[#E7E8E8] text-[#7B868F] cursor-not-allowed"
              : "bg-[#191E24] text-white hover:bg-black"
          }`}
          title={isClassFull ? "Kapasitas kelas penuh (maksimal 40 murid)" : "Tambah murid baru"}
        >
          <UserPlus className="h-4 w-4 text-[#C2B535]" />
          <span>Tambah Murid</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
            toast.type === "success"
              ? "bg-[#F2F6F3] text-[#3B5A42] border-[#D6E2D8]"
              : "bg-[#F8F3F3] text-[#7B3F3E] border-[#E7D6D6]"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#3B5A42] flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#7B3F3E] flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Class Selector Bar */}
      <div className="saas-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-[#191E24] uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-[#C2B535]" />
            Pilih Kelas:
          </label>
          <span className="text-[11px] text-[#7B868F]">
            Tersedia {classes.length} kelas aktif
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedClassId("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedClassId === "all"
                ? "bg-[#191E24] text-white border-[#191E24] shadow-xs"
                : "bg-[#F5F5F5] text-[#7B868F] border-[#E7E8E8] hover:text-[#191E24]"
            }`}
          >
            Semua Kelas
          </button>
          {classes.map((c) => {
            const isSelected = selectedClassId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-[#191E24] text-white border-[#191E24] shadow-xs"
                    : "bg-[#F5F5F5] text-[#7B868F] border-[#E7E8E8] hover:text-[#191E24]"
                }`}
              >
                Kelas {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Capacity Indicator Card (if viewing a specific class) */}
      {!isAllView && (
        <div className="saas-card p-5 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E7E8E8]">
            <div>
              <h2 className="text-sm font-bold text-[#191E24] flex items-center gap-2">
                <span>Kelas {currentClass?.name || "Terpilih"}</span>
                {currentClass?.description && (
                  <span className="text-xs font-normal text-[#7B868F]">
                    • {currentClass.description}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#7B868F] mt-0.5">
                Kapasitas maksimum adalah 40 murid per kelas
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isClassFull
                    ? "bg-[#F8F3F3] text-[#7B3F3E] border-[#E7D6D6]"
                    : classStudentCount >= 35
                    ? "bg-[#FAF7F2] text-[#786134] border-[#EADBCA]"
                    : "bg-[#F2F6F3] text-[#3B5A42] border-[#D6E2D8]"
                }`}
              >
                {classStudentCount} / {maxCapacity} Murid
              </span>
            </div>
          </div>

          {/* Visual Capacity Meter Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-[#7B868F]">
              <span>Keterisian Kelas: {capacityPercent}%</span>
              <span>
                {isClassFull
                  ? "Kapasitas Penuh"
                  : `Tersisa ${capacityLeft} kursi murid`}
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#F5F5F5] rounded-full overflow-hidden border border-[#E7E8E8]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isClassFull
                    ? "bg-[#7B3F3E]"
                    : classStudentCount >= 35
                    ? "bg-[#C2B535]"
                    : "bg-[#191E24]"
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {isClassFull && (
            <div className="p-3 rounded-xl bg-[#F8F3F3] border border-[#E7D6D6] text-[#7B3F3E] text-xs font-medium flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Batas maksimal 40 murid telah tercapai untuk kelas ini. Hapus atau pindahkan murid sebelum menambahkan murid baru.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card container: Search, Filters & Student List */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-2xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2B535] text-[#191E24]"
            />
            <Search className="h-4 w-4 text-[#7B868F] absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#191E24] text-white shadow-2xs"
                    : "bg-[#F5F5F5] text-[#7B868F] hover:bg-[#E7E8E8] hover:text-[#191E24]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2 pt-2">
          {loading ? (
            <p className="text-center py-8 text-xs text-[#7B868F]">
              Memuat data siswa...
            </p>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs text-[#7B868F]">
                Tidak ada siswa yang sesuai pencarian atau filter.
              </p>
              {!isClassFull && !isAllView && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F5F5] hover:bg-[#EAEAEA] text-xs font-semibold text-[#191E24] transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Daftarkan Siswa Pertama</span>
                </button>
              )}
            </div>
          ) : (
            filteredStudents.map((st) => (
              <StudentRow
                key={st.id}
                name={st.name}
                studentNumber={st.studentNumber}
                time={st.scanTime}
                status={st.status}
                notes={st.notes}
                classNameTag={isAllView ? st.className : undefined}
                isClickable={true}
                onClick={() => setSelectedStudent(st)}
                onDelete={() => handleDeleteStudent(st.id, st.name)}
              />
            ))
          )}
        </div>
      </div>

      {/* Manual Status Override Modal */}
      <ManualAttendanceModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        sessionId={activeSessionId}
        onClose={() => setSelectedStudent(null)}
        onStatusUpdated={() => loadStudents()}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStudentAdded={() => {
          setToast({ text: "Murid berhasil ditambahkan!", type: "success" });
          loadStudents();
        }}
        classes={classes}
        defaultClassId={selectedClassId !== "all" ? selectedClassId : undefined}
      />
    </div>
  );
}

