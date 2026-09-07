"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, BookOpen, Sparkles, Loader2 } from "lucide-react";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated?: (session: { id: string; subject: string }) => void;
  defaultClassId?: string;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onSessionCreated,
  defaultClassId = "cls-xid",
}: CreateSessionModalProps) {
  const router = useRouter();
  const [subject, setSubject] = useState<string>("Matematika");
  const [classId, setClassId] = useState<string>(defaultClassId);
  const [classes, setClasses] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("07:00");
  const [duration, setDuration] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetch("/api/classes")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.classes)) {
            setClasses(data.classes);
            if (!classId && data.classes.length > 0) {
              setClassId(data.classes[0].id);
            }
          }
        })
        .catch(console.warn);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          date,
          start_time: startTime,
          duration_minutes: Number(duration),
          class_id: classId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat sesi absensi");
      }

      if (onSessionCreated) {
        onSessionCreated(data.session);
      }

      onClose();
      router.push(`/admin/qr?id=${data.session.id}`);
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
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#191E24]">
              <Sparkles className="h-4 w-4 text-[#8C7F24]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191E24]">
                Buat Sesi Absensi
              </h3>
              <p className="text-xs text-[#7B868F]">
                {classes.find((c) => c.id === classId)?.name ? `Kelas ${classes.find((c) => c.id === classId)?.name}` : "Pilih Kelas"}
              </p>
            </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {classes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
                Target Kelas
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24] font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} {c.description ? `(${c.description})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[#7B868F]" />
              Mata Pelajaran
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Matematika, Fisika, Biologi"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#7B868F]" />
                Tanggal
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#7B868F]" />
                Jam Mulai
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              Durasi Batas Waktu QR
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                    duration === mins
                      ? "bg-[#191E24] text-white border-[#191E24]"
                      : "bg-[#F5F5F5] text-[#7B868F] border-transparent hover:border-[#E7E8E8]"
                  }`}
                >
                  {mins} Menit
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !subject.trim()}
              className="w-full saas-btn bg-[#191E24] hover:bg-black text-white font-semibold text-sm shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Mulai Absensi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
