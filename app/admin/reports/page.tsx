"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Download,
  Search,
  Trash2,
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useRequireAuth } from "@/lib/authContext";
import AbelasLogo from "@/components/AbelasLogo";

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  dayName: string;
  status: "hadir" | "terlambat";
  isExtraDay: boolean;
}

interface ClassItem {
  id: string;
  name: string;
}

export default function AdminReportsPage() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/attendance?limit=500";
      if (filterDate) url += `&date=${filterDate}`;
      if (filterClass !== "all") url += `&classId=${filterClass}`;
      if (searchQuery) url += `&studentId=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        if (data.allClasses) {
          setClasses(data.allClasses);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch reports", e);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterClass, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const headers = [
      "No",
      "Nama Siswa",
      "NIS / ID",
      "Kelas",
      "Hari",
      "Tanggal",
      "Jam Scan (WIB)",
      "Status",
      "Hari Tambahan",
    ];

    const rows = records.map((rec, index) => [
      index + 1,
      `"${rec.studentName.replace(/"/g, '""')}"`,
      `"${rec.studentId}"`,
      `"${rec.className.replace(/"/g, '""')}"`,
      rec.dayName,
      rec.date,
      rec.time,
      rec.status.toUpperCase(),
      rec.isExtraDay ? "YA" : "TIDAK",
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Rekap_Absensi_${filterDate || "Semua"}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data presensi untuk ${name}?`)) return;

    try {
      const res = await fetch(`/api/attendance?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || "Gagal menghapus data");
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const hadirCount = records.filter((r) => r.status === "hadir").length;
  const lateCount = records.filter((r) => r.status === "terlambat").length;
  const extraCount = records.filter((r) => r.isExtraDay).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#191E24] tracking-tight">
                Rekapitulasi Kehadiran
              </h1>
              <span className="hidden sm:inline-block">
                <AbelasLogo variant="horizontal" size="xs" />
              </span>
            </div>
            <p className="text-xs text-[#7B868F]">
              Laporan data absensi siswa dan ekspor spreadsheet
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#191E24] hover:bg-black text-white font-semibold text-xs shadow-xs transition-all self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Export ke Excel / CSV</span>
        </button>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="saas-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] text-[#191E24] flex items-center justify-center">
            <Users className="h-4 w-4 text-[#7B868F]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#7B868F] uppercase">Total Data</p>
            <p className="text-xl font-bold text-[#191E24]">{records.length}</p>
          </div>
        </div>

        <div className="saas-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F2F6F3] border border-[#D6E2D8] text-[#3B5A42] flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-[#3B5A42]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#7B868F] uppercase">Tepat Waktu</p>
            <p className="text-xl font-bold text-[#3B5A42]">{hadirCount}</p>
          </div>
        </div>

        <div className="saas-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#FAF7F2] border border-[#EADBCA] text-[#786134] flex items-center justify-center">
            <Clock className="h-4 w-4 text-[#786134]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#7B868F] uppercase">Terlambat</p>
            <p className="text-xl font-bold text-[#786134]">{lateCount}</p>
          </div>
        </div>

        <div className="saas-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F6F4F7] border border-[#DFD9E5] text-[#584D67] flex items-center justify-center">
            <Calendar className="h-4 w-4 text-[#584D67]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#7B868F] uppercase">Hari Tambahan</p>
            <p className="text-xl font-bold text-[#584D67]">{extraCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="saas-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#7B868F] mb-1">
              Filter Tanggal
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#7B868F] mb-1">
              Filter Kelas
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#7B868F] mb-1">
              Cari Nama / NIS Siswa
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama atau NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />
              <Search className="h-3.5 w-3.5 text-[#7B868F] absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {(filterDate || filterClass !== "all" || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setFilterDate("");
                setFilterClass("all");
                setSearchQuery("");
              }}
              className="text-[11px] font-semibold text-[#191E24] hover:underline"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Attendance Table Card */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 border-b border-[#E7E8E8] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#191E24]">
            Daftar Presensi ({records.length})
          </h3>
          <span className="text-xs text-[#7B868F]">1 QR = 1 Presensi Valid</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#191E24]">
            <thead className="bg-[#F5F5F5] text-[11px] font-semibold text-[#7B868F] uppercase tracking-wider border-b border-[#E7E8E8]">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jam Scan</th>
                <th className="px-4 py-3">Tipe Hari</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E8E8]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#7B868F]">
                    Memuat data absensi...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#7B868F]">
                    Tidak ada data presensi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-[#F5F5F5]/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#7B868F]">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#191E24]">{rec.studentName}</div>
                      <div className="text-[11px] text-[#7B868F]">NIS: {rec.studentId}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#7B868F]">
                      {rec.className}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#7B868F]">
                      {rec.dayName}, {rec.date}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#191E24] whitespace-nowrap">
                      {rec.time} WIB
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rec.isExtraDay ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] text-[#786134] border border-[#EADBCA]">
                          Hari Tambahan
                        </span>
                      ) : (
                        <span className="text-[#7B868F] text-[11px]">Reguler</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                          rec.status === "hadir"
                            ? "bg-[#F2F6F3] text-[#3B5A42] border-[#D6E2D8]"
                            : "bg-[#FAF7F2] text-[#786134] border-[#EADBCA]"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(rec.id, rec.studentName)}
                        title="Hapus rekaman"
                        className="p-1.5 text-[#7B868F] hover:text-[#7B3F3E] hover:bg-[#F8F3F3] rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
