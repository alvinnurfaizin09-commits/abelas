"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useRequireAuth } from "@/lib/authContext";

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export default function AdminClassesPage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [className, setClassName] = useState<string>("");
  const [classDesc, setClassDesc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (e) {
      console.warn("Failed to fetch classes", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: className.trim(),
          description: classDesc.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ text: "Kelas berhasil ditambahkan", type: "success" });
        setClassName("");
        setClassDesc("");
        fetchClasses();
      } else {
        setMessage({ text: data.error || "Gagal menambahkan kelas", type: "error" });
      }
    } catch (err: unknown) {
      setMessage({ text: (err as Error).message || "Terjadi kesalahan", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${name}"?`)) return;

    try {
      const res = await fetch(`/api/classes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: `Kelas "${name}" berhasil dihapus`, type: "success" });
        fetchClasses();
      } else {
        setMessage({ text: data.error || "Gagal menghapus kelas", type: "error" });
      }
    } catch (err: unknown) {
      setMessage({ text: (err as Error).message, type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#191E24] tracking-tight">
            Kelola Nama Kelas
          </h1>
          <p className="text-xs text-[#7B868F]">
            Tambahkan atau atur daftar kelas untuk presensi QR Code
          </p>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
            message.type === "success"
              ? "bg-[#F2F6F3] text-[#3B5A42] border-[#D6E2D8]"
              : "bg-[#F8F3F3] text-[#7B3F3E] border-[#E7D6D6]"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-[#3B5A42] flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#7B3F3E] flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add New Class Form */}
      <div className="saas-card p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E8E8]">
          <div className="h-8 w-8 rounded-xl bg-[#F5F5F5] border border-[#E7E8E8] text-[#191E24] flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#191E24]">
              Tambah Kelas Baru
            </h3>
            <p className="text-[11px] text-[#7B868F]">
              Ketik nama kelas sendiri (misal: XII RPL 1, XI TKJ, X IPA 2)
            </p>
          </div>
        </div>

        <form onSubmit={handleAddClass} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
                Nama Kelas <span className="text-[#7B3F3E]">*</span>
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Contoh: XII Rekayasa Perangkat Lunak 2"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
                Keterangan / Ruang Laboratorium
              </label>
              <input
                type="text"
                value={classDesc}
                onChange={(e) => setClassDesc(e.target.value)}
                placeholder="Contoh: Lab Komputer 2 (Gedung B)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !className.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#191E24] hover:bg-black text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{submitting ? "Menyimpan..." : "Simpan Kelas"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Class List */}
      <div className="saas-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E8]">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#7B868F]" />
            <h3 className="font-bold text-sm text-[#191E24]">
              Daftar Kelas Terdaftar
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#7B868F]">
            {classes.length} Kelas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {loading ? (
            <p className="col-span-2 text-center py-8 text-xs text-[#7B868F]">
              Memuat data kelas...
            </p>
          ) : classes.length === 0 ? (
            <p className="col-span-2 text-center py-8 text-xs text-[#7B868F]">
              Belum ada kelas yang ditambahkan. Gunakan formulir di atas untuk menambahkan.
            </p>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="rounded-2xl p-4 border border-[#E7E8E8] bg-[#FAFAFA] hover:border-[#191E24] transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#F0F0F0] text-[#191E24] flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-[#7B868F]" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#191E24] group-hover:text-[#191E24] transition-colors">
                      {cls.name}
                    </h4>
                    {cls.description && (
                      <p className="text-[11px] text-[#7B868F] mt-0.5">
                        {cls.description}
                      </p>
                    )}
                    <span className="inline-block mt-2 text-[10px] font-mono text-[#7B868F]">
                      ID: {cls.id}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteClass(cls.id, cls.name)}
                  title="Hapus Kelas"
                  className="p-1.5 text-[#7B868F] hover:text-[#7B3F3E] hover:bg-[#F8F3F3] rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
