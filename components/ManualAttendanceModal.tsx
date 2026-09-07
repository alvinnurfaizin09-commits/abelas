"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { AttendanceStatus } from "@/lib/db";

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    studentNumber: string;
    status: AttendanceStatus | "belum_hadir";
    notes?: string;
  } | null;
  sessionId: string;
  onStatusUpdated: () => void;
}

const statusOptions: { value: AttendanceStatus; label: string; desc: string; color: string }[] = [
  { value: "hadir", label: "Hadir", desc: "Siswa hadir tepat waktu di kelas", color: "border-[#D6E2D8] text-[#3B5A42] bg-[#F2F6F3]" },
  { value: "terlambat", label: "Terlambat", desc: "Siswa hadir melebihi jam mulai", color: "border-[#EADBCA] text-[#786134] bg-[#FAF7F2]" },
  { value: "izin", label: "Izin", desc: "Izin keperluan keluarga atau kegiatan", color: "border-[#D7DFE6] text-[#3E5266] bg-[#F3F6F8]" },
  { value: "sakit", label: "Sakit", desc: "Disertai surat dokter / keterangan sakit", color: "border-[#DFD9E5] text-[#584D67] bg-[#F6F4F7]" },
  { value: "alpha", label: "Alpha", desc: "Tidak hadir tanpa keterangan", color: "border-[#E7D6D6] text-[#7B3F3E] bg-[#F8F3F3]" },
];

export default function ManualAttendanceModal({
  isOpen,
  onClose,
  student,
  sessionId,
  onStatusUpdated,
}: ManualAttendanceModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("hadir");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      if (student.status !== "belum_hadir") {
        setSelectedStatus(student.status as AttendanceStatus);
      } else {
        setSelectedStatus("hadir");
      }
      setNotes(student.notes || "");
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: student.id,
          status: selectedStatus,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengubah status");
      }

      onStatusUpdated();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[24px] bg-white border border-[#E7E8E8] shadow-xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E8E8]">
          <div>
            <h3 className="text-base font-bold text-[#191E24]">
              Ubah Status Absensi Manual
            </h3>
            <p className="text-xs text-[#7B868F] mt-0.5">
              {student.name} • NIS: {student.studentNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7B868F] hover:text-[#191E24] hover:bg-[#F5F5F5] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-[#F8F3F3] border border-[#E7D6D6] text-xs text-[#7B3F3E] font-medium">
            {error}
          </div>
        )}

        {/* Options */}
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-[#191E24]">
            Pilih Status:
          </label>
          <div className="space-y-2">
            {statusOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedStatus === opt.value
                    ? `${opt.color} font-semibold shadow-2xs`
                    : "border-[#E7E8E8] hover:bg-[#F5F5F5] text-[#191E24]"
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[11px] opacity-75">{opt.desc}</p>
                </div>
                {selectedStatus === opt.value && (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 opacity-80" />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1">
              Catatan Khusus (Opsional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mengikuti kegiatan perwakilan sekolah"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 saas-btn bg-[#F5F5F5] text-[#7B868F] hover:text-[#191E24] text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 saas-btn bg-[#191E24] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
