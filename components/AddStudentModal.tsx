"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, CheckCircle2, Loader2, Users } from "lucide-react";
import { ClassItem } from "@/lib/db";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
  classes: ClassItem[];
  defaultClassId?: string;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  onStudentAdded,
  classes,
  defaultClassId,
}: AddStudentModalProps) {
  const [name, setName] = useState<string>("");
  const [studentNumber, setStudentNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [classId, setClassId] = useState<string>(defaultClassId || (classes[0]?.id ?? "cls-xid"));
  const [password, setPassword] = useState<string>("siswa123");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-fill / reset when opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setStudentNumber("");
      setEmail("");
      setPassword("siswa123");
      setError(null);
      setSuccessMsg(null);
      if (defaultClassId && defaultClassId !== "all") {
        setClassId(defaultClassId);
      } else if (classes.length > 0) {
        setClassId(classes[0].id);
      }
    }
  }, [isOpen, defaultClassId, classes]);

  // Auto generate email when name changes if email hasn't been manually edited
  const handleNameChange = (val: string) => {
    setName(val);
    const slug = val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".");
    if (slug) {
      setEmail(`${slug}@siswa.sch.id`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentNumber.trim() || !email.trim() || !classId) {
      setError("Semua bidang wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          student_number: studentNumber.trim(),
          email: email.trim(),
          class_id: classId,
          password: password.trim() || "siswa123",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menambahkan murid");
      }

      setSuccessMsg("Siswa berhasil didaftarkan!");
      setTimeout(() => {
        onStudentAdded();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="saas-card w-full max-w-md p-6 space-y-5 bg-white shadow-xl relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 p-2 text-[#7B868F] hover:text-[#191E24] hover:bg-[#F5F5F5] rounded-xl transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] flex items-center justify-center text-[#191E24] flex-shrink-0">
            <UserPlus className="h-5 w-5 text-[#191E24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#191E24]">Tambah Murid Baru</h2>
            <p className="text-xs text-[#7B868F]">
              Setiap kelas dibatasi maksimal 40 murid
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl border border-[#E7D6D6] bg-[#F8F3F3] text-[#7B3F3E] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl border border-[#D6E2D8] bg-[#F2F6F3] text-[#3B5A42] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Class Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              Kelas Tujuan
            </label>
            <div className="relative">
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24] font-medium"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.description ? `(${cls.description})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-[#7B868F] mt-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Siswa akan terdaftar dan diisolasi hanya pada kelas{" "}
              <span className="font-semibold text-[#191E24]">
                {selectedClass?.name || "ini"}
              </span>
            </p>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              Nama Lengkap Murid
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          {/* NIS */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              NIS (Nomor Induk Siswa)
            </label>
            <input
              type="text"
              placeholder="Contoh: 20261040"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              Email Akun Siswa
            </label>
            <input
              type="email"
              placeholder="budi.santoso@siswa.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          {/* Password Default */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              Password Awal (Default)
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24] font-mono"
            />
            <p className="text-[11px] text-[#7B868F] mt-1">
              Murid dapat login menggunakan email/NIS dan password ini.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#7B868F] hover:text-[#191E24] hover:bg-[#F5F5F5] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#191E24] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-[#C2B535]" />}
              <span>{loading ? "Menyimpan..." : "Simpan Siswa"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
