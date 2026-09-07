"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  AlertTriangle,
  Users,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { playSuccessSound } from "@/lib/sound";
import { useRequireAuth } from "@/lib/authContext";
import AbelasLogo from "@/components/AbelasLogo";
import { getSupabase } from "@/lib/supabaseClient";

interface SessionDetail {
  id: string;
  class_id: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  qr_token: string;
  status: "active" | "expired" | "closed";
  expires_at: string;
  remainingSeconds: number;
  isExpired: boolean;
}

function QRContent() {
  const { currentUser, isLoading: authLoading } = useRequireAuth("admin");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") || "ATT-20260906-001";

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [presentCount, setPresentCount] = useState<number>(32);
  const [totalStudents] = useState<number>(36);
  const [recentAttendee, setRecentAttendee] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(32);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setRemainingSeconds(data.session.remainingSeconds);
        setIsExpired(data.session.isExpired);
      }
    } catch (e) {
      console.warn("Failed to fetch session detail", e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance?session_id=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        const count = data.records.length;
        if (count > prevCountRef.current) {
          playSuccessSound();
          const latest = data.records[data.records.length - 1];
          setRecentAttendee(`${latest.studentName} (${latest.scan_time})`);
          setTimeout(() => setRecentAttendee(null), 4000);
        }
        prevCountRef.current = count;
        setPresentCount(count);
      }
    } catch (e) {
      console.warn("Failed to fetch attendee count", e);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    fetchAttendees();

    // Fallback polling every 3s
    const interval = setInterval(fetchAttendees, 3000);

    // Supabase Realtime WebSocket subscription (instant updates)
    const supabase = getSupabase();
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel(`qr-attendees-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendance_records",
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            fetchAttendees();
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchSession, fetchAttendees, sessionId]);

  useEffect(() => {
    if (isExpired) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExpired]);

  const handleExtend5Min = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_5_min" }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setRemainingSeconds(data.session.remainingSeconds);
        setIsExpired(false);
      }
    } catch (e) {
      alert("Gagal memperpanjang sesi: " + (e as Error).message);
    }
  };

  const handleRegenerateToken = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_token" }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setRemainingSeconds(data.session.remainingSeconds);
        setIsExpired(false);
      }
    } catch (e) {
      alert("Gagal generate QR baru: " + (e as Error).message);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (totalSec: number) => {
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const qrPayload = session
    ? `attendance/session/${session.id}?token=${session.qr_token}`
    : "";

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#F5F5F5] p-8 overflow-y-auto flex flex-col items-center justify-center"
          : ""
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 w-full max-w-xl mx-auto">
        <Link
          href="/admin"
          className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E7E8E8] text-xs font-semibold text-[#191E24]">
            <Users className="h-3.5 w-3.5 text-[#7B868F]" />
            <span>
              {presentCount} / {totalStudents} Hadir
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Tampilan Layar Penuh (Proyektor)"}
            className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] transition-colors shadow-2xs"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main QR Card */}
      <div className="w-full max-w-md mx-auto saas-card p-6 sm:p-8 text-center space-y-5">
        {/* Branding Logo */}
        <div className="flex justify-center pt-1 pb-0.5">
          <div className="p-2 rounded-2xl bg-white border border-[#E7E8E8] shadow-2xs">
            <AbelasLogo variant="square" size="sm" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#191E24] tracking-tight">
            Absensi {session?.subject || "Matematika"}
          </h2>
          <p className="text-xs sm:text-sm text-[#7B868F] mt-1 font-medium">
            Scan QR untuk melakukan absensi
          </p>
        </div>

        {/* Big QR Code in Center */}
        <div className="relative py-2 flex items-center justify-center">
          <div
            className={`p-6 rounded-[24px] bg-white border transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${
              isExpired
                ? "border-[#E7D6D6] opacity-35 grayscale"
                : "border-[#E7E8E8] hover:border-[#191E24]"
            }`}
          >
            {loading ? (
              <div className="h-56 w-56 flex items-center justify-center text-[#7B868F]">
                <RefreshCw className="h-8 w-8 animate-spin text-[#191E24]" />
              </div>
            ) : qrPayload ? (
              <QRCodeSVG
                value={qrPayload}
                size={isFullscreen ? 300 : 220}
                level="H"
                includeMargin={false}
              />
            ) : null}
          </div>

          {/* Expired Overlay Badge */}
          {isExpired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="p-4 rounded-2xl bg-[#191E24] text-white shadow-lg flex flex-col items-center gap-1.5 animate-in zoom-in-95">
                <AlertTriangle className="h-5 w-5 text-[#EEDB8A]" />
                <span className="text-xs font-bold">QR Code telah kedaluwarsa</span>
                <span className="text-[11px] text-[#A6AFB8]">Perpanjang untuk mengaktifkan kembali</span>
              </div>
            </div>
          )}
        </div>

        {/* Session Details */}
        <div className="space-y-1 text-xs font-semibold text-[#191E24]">
          <p className="text-sm font-bold text-[#191E24]">Kelas XI-D</p>
          <p className="text-[#7B868F]">
            {session?.date || "06 September 2026"}
          </p>
          <p className="text-[#7B868F] font-mono">
            {session?.start_time || "07:00"} – {session?.end_time || "07:05"}
          </p>
        </div>

        {/* Countdown Realtime */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-[#7B868F] uppercase tracking-wider">
            {isExpired ? "Status Sesi" : "QR berakhir dalam"}
          </p>
          <div
            className={`text-4xl font-bold font-mono tracking-wider mt-1 ${
              isExpired
                ? "text-[#7B3F3E]"
                : remainingSeconds < 60
                ? "text-[#786134]"
                : "text-[#191E24]"
            }`}
          >
            {isExpired ? "00:00" : formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Action Buttons: Perpanjang 5 Menit / Buat QR Baru */}
        <div className="pt-2 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleExtend5Min}
            className="saas-btn bg-[#191E24] text-white hover:bg-black text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <Clock className="h-4 w-4 text-[#C2B535]" />
            <span>Perpanjang 5 menit</span>
          </button>

          <button
            onClick={handleRegenerateToken}
            className="saas-btn bg-white border border-[#E7E8E8] text-[#191E24] hover:border-[#191E24] text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <RefreshCw className="h-4 w-4 text-[#7B868F]" />
            <span>Buat QR Baru</span>
          </button>
        </div>

        {/* Live Notification of Recent Scans */}
        {recentAttendee && (
          <div className="p-3 rounded-2xl bg-[#F2F6F3] border border-[#D6E2D8] text-[#3B5A42] text-xs font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Berhasil absen: {recentAttendee}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QRPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-[#7B868F]">
          Memuat sesi QR...
        </div>
      }
    >
      <QRContent />
    </Suspense>
  );
}
