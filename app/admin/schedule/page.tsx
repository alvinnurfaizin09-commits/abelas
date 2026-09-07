"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { useRequireAuth } from "@/lib/authContext";

interface SystemSettings {
  schoolName: string;
  allowExtraDays: boolean;
  extraDays: string[];
  specificExtraDates: string[];
  startTime: string;
  lateThresholdTime: string;
  autoRefreshQrSeconds: number;
}

export default function AdminSchedulePage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const [settings, setSettings] = useState<SystemSettings>({
    schoolName: "SMK / SMA Negeri - Sistem Presensi Digital",
    allowExtraDays: true,
    extraDays: ["Sabtu", "Minggu"],
    specificExtraDates: ["2026-09-06"],
    startTime: "07:00",
    lateThresholdTime: "07:30",
    autoRefreshQrSeconds: 0,
  });

  const [newDateInput, setNewDateInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      } catch (e) {
        console.warn("Failed to fetch settings", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ text: "Pengaturan hari tambahan berhasil disimpan", type: "success" });
      } else {
        setToast({ text: data.error || "Gagal menyimpan pengaturan", type: "error" });
      }
    } catch (err: unknown) {
      setToast({ text: (err as Error).message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleExtraDay = (day: string) => {
    const current = [...settings.extraDays];
    if (current.includes(day)) {
      setSettings({ ...settings, extraDays: current.filter((d) => d !== day) });
    } else {
      setSettings({ ...settings, extraDays: [...current, day] });
    }
  };

  const addSpecificDate = () => {
    if (!newDateInput || settings.specificExtraDates.includes(newDateInput)) return;
    setSettings({
      ...settings,
      specificExtraDates: [...settings.specificExtraDates, newDateInput],
    });
    setNewDateInput("");
  };

  const removeSpecificDate = (dateStr: string) => {
    setSettings({
      ...settings,
      specificExtraDates: settings.specificExtraDates.filter((d) => d !== dateStr),
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-6">
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
            Pengaturan Jadwal & Hari Tambahan
          </h1>
          <p className="text-xs text-[#7B868F]">
            Konfigurasi sesi akhir pekan dan batas toleransi jam masuk
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
            toast.type === "success"
              ? "bg-[#F2F6F3] text-[#3B5A42] border-[#D6E2D8]"
              : "bg-[#F8F3F3] text-[#7B3F3E] border-[#E7D6D6]"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-[#3B5A42] flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#7B3F3E] flex-shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Hari Tambahan Toggle */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E8E8]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] text-[#191E24] flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-[#7B868F]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#191E24]">
                  Izin Presensi di Luar Hari Kerja
                </h3>
                <p className="text-xs text-[#7B868F] mt-0.5">
                  Izinkan absensi pada hari Sabtu, Minggu, atau tanggal kegiatan khusus
                </p>
              </div>
            </div>

            {/* Toggle Switch - Muted Neutral */}
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={settings.allowExtraDays}
                onChange={(e) =>
                  setSettings({ ...settings, allowExtraDays: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E0E0E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#191E24]"></div>
            </label>
          </div>

          {settings.allowExtraDays && (
            <div className="space-y-4 animate-in fade-in duration-200 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#191E24] mb-2">
                  Pilih Hari Mingguan Tambahan:
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Sabtu", "Minggu"].map((day) => {
                    const isSelected = settings.extraDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleExtraDay(day)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-[#191E24] text-white border-[#191E24] shadow-xs"
                            : "bg-[#F5F5F5] text-[#7B868F] border-[#E7E8E8] hover:text-[#191E24]"
                        }`}
                      >
                        Hari {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tanggal Khusus */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
                  Tambahkan Tanggal Khusus (Remedial / Les / Ujian):
                </label>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="date"
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    className="text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
                  />
                  <button
                    type="button"
                    onClick={addSpecificDate}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F5F5F5] text-[#191E24] border border-[#E7E8E8] font-semibold text-xs hover:bg-[#EAEAEA] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah</span>
                  </button>
                </div>

                {settings.specificExtraDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {settings.specificExtraDates.map((dateStr) => (
                      <span
                        key={dateStr}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-[#F5F5F5] text-[#191E24] border border-[#E7E8E8]"
                      >
                        <span>{dateStr}</span>
                        <button
                          type="button"
                          onClick={() => removeSpecificDate(dateStr)}
                          className="text-[#7B868F] hover:text-[#7B3F3E]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Aturan Jam Masuk & Keterlambatan */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E7E8E8]">
            <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] text-[#191E24] flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-[#7B868F]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#191E24]">
                Aturan Jam Masuk & Batas Terlambat
              </h3>
              <p className="text-xs text-[#7B868F]">
                Siswa yang scan melebihi batas waktu akan ditandai Terlambat
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
                Jam Mulai Presensi (WIB)
              </label>
              <input
                type="time"
                value={settings.startTime}
                onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
                Batas Jam Tepat Waktu (WIB)
              </label>
              <input
                type="time"
                value={settings.lateThresholdTime}
                onChange={(e) =>
                  setSettings({ ...settings, lateThresholdTime: e.target.value })
                }
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5">
              Nama Lembaga / Sekolah
            </label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#191E24] hover:bg-black text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all"
          >
            <Save className="h-4 w-4 text-[#C2B535]" />
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
