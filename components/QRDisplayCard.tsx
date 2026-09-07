"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { playSuccessSound } from "@/lib/sound";

interface ClassItem {
  id: string;
  name: string;
}

interface QRDisplayCardProps {
  classes: ClassItem[];
  selectedClassId: string;
  onClassChange: (id: string) => void;
  onScanSuccess?: () => void;
}

export default function QRDisplayCard({
  classes,
  selectedClassId,
  onClassChange,
  onScanSuccess,
}: QRDisplayCardProps) {
  const [token, setToken] = useState<string>("");
  const [qrPayload, setQrPayload] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lastScannedUser, setLastScannedUser] = useState<{
    name: string;
    studentId: string;
    time: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate new one-time QR Token
  const generateNewQR = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClassId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat QR token");
      }
      setToken(data.token);
      setQrPayload(data.qrPayload);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  // Initial load and whenever class changes
  useEffect(() => {
    if (selectedClassId) {
      generateNewQR();
    }
  }, [selectedClassId, generateNewQR]);

  // Real-time polling for token status
  useEffect(() => {
    if (!token) return;

    const checkTokenStatus = async () => {
      try {
        const res = await fetch(`/api/qr/status?token=${token}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.isUsed && data.usedBy) {
          // Play success chime
          playSuccessSound();
          setLastScannedUser({
            name: data.usedBy.studentName,
            studentId: data.usedBy.studentId,
            time: data.usedBy.time,
          });

          if (onScanSuccess) {
            onScanSuccess();
          }

          // Auto-generate next fresh token for next student in 1.8 seconds
          setTimeout(() => {
            generateNewQR();
          }, 1800);
        }
      } catch (e) {
        console.warn("Poll status check failed", e);
      }
    };

    pollTimerRef.current = setInterval(checkTokenStatus, 1500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [token, generateNewQR, onScanSuccess]);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div
      ref={containerRef}
      className={`rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white rounded-none border-0 p-8"
          : ""
      }`}
    >
      {/* Header & Controls */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <h3 className={`font-bold text-lg ${isFullscreen ? "text-white" : "text-slate-900"}`}>
              Live QR Presenter
            </h3>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              1 QR = 1 Scan
            </span>
          </div>
          <p className={`text-xs ${isFullscreen ? "text-slate-400" : "text-slate-500"} mt-0.5`}>
            Kode otomatis hangus setelah discan dan otomatis memperbarui untuk siswa berikutnya.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Class selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedClassId}
              onChange={(e) => onClassChange(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isFullscreen
                  ? "bg-slate-900 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateNewQR}
            disabled={loading}
            title="Generate Ulang QR"
            className="p-2 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Tampilan Layar Penuh (Proyektor)"}
            className="p-2 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* QR Display Area */}
      <div className="py-6 flex flex-col items-center justify-center">
        {selectedClass && (
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              <Users className="h-3.5 w-3.5" />
              {selectedClass.name}
            </span>
          </div>
        )}

        <div className="relative p-5 rounded-3xl bg-white border-2 border-indigo-100 shadow-xl shadow-indigo-100/50 flex items-center justify-center">
          {error ? (
            <div className="h-64 w-64 flex flex-col items-center justify-center text-center p-4 text-rose-600">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={generateNewQR}
                className="mt-3 px-3 py-1 bg-rose-50 text-rose-700 text-xs rounded-xl font-bold border border-rose-200"
              >
                Coba Lagi
              </button>
            </div>
          ) : qrPayload ? (
            <div className="flex flex-col items-center">
              <QRCodeSVG
                value={qrPayload}
                size={isFullscreen ? 320 : 220}
                level="M"
                includeMargin={false}
              />
              <div className="mt-3 flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <span>ID: {token.slice(0, 14)}...</span>
              </div>
            </div>
          ) : (
            <div className="h-64 w-64 flex items-center justify-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          )}
        </div>

        {/* Live Notification Banner */}
        <div className="w-full max-w-sm mt-5">
          {lastScannedUser ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900 truncate">
                  {lastScannedUser.name}
                </p>
                <p className="text-[11px] text-emerald-700">
                  NIS: {lastScannedUser.studentId} • {lastScannedUser.time} WIB
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                Hadir
              </span>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3 flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
              <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
              <span>Menunggu scan siswa berikutnya...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
