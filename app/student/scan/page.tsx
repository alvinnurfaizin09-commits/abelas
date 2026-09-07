"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  Keyboard,
  RotateCcw,
} from "lucide-react";
import { playSuccessSound, playErrorSound } from "@/lib/sound";
import { useRequireAuth } from "@/lib/authContext";
import AbelasLogo from "@/components/AbelasLogo";

interface ScanSuccessData {
  studentName: string;
  subject: string;
  scanTime: string;
  status: string;
  newlyEnrolled?: boolean;
  className?: string;
}

interface DuplicateData {
  studentName: string;
  subject: string;
  scanTime: string;
  status: string;
}

export default function StudentScanPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useRequireAuth("student");
  const studentId = currentUser?.id || "std-1001";
  const studentName = currentUser?.name || "Siswa";

  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [manualInput, setManualInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<ScanSuccessData | null>(null);
  const [duplicateData, setDuplicateData] = useState<DuplicateData | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = "student-camera-reader";

  const handleVerifyQR = useCallback(
    async (scannedContent: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      setGeneralError(null);
      setDuplicateData(null);

      try {
        let sessionId = "ATT-20260906-001";
        let token = scannedContent.trim();

        if (scannedContent.includes("session/")) {
          const parts = scannedContent.split("session/")[1];
          const [sessPart, queryPart] = parts.split("?");
          if (sessPart) sessionId = sessPart;
          if (queryPart && queryPart.includes("token=")) {
            token = queryPart.split("token=")[1].split("&")[0];
          }
        }

        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            token,
            student_id: studentId,
          }),
        });

        const data = await res.json();

        if (res.status === 200 && data.success) {
          playSuccessSound();
          const enrolledClass = data.className || data.data?.className;
          setSuccessData({
            studentName: data.data.studentName,
            subject: data.data.subject,
            scanTime: data.data.scanTime,
            status: data.data.status,
            newlyEnrolled: data.newlyEnrolled,
            className: enrolledClass,
          });

          // update local user class_id if newly enrolled
          if (currentUser && (data.newlyEnrolled || data.class_id)) {
            try {
              const savedUser = localStorage.getItem("absensi_auth_user");
              if (savedUser) {
                const parsed = JSON.parse(savedUser);
                parsed.class_id = data.class_id || parsed.class_id;
                localStorage.setItem("absensi_auth_user", JSON.stringify(parsed));
              }
            } catch {}
          }

          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } else if (res.status === 409 && data.isDuplicate) {
          playErrorSound();
          setDuplicateData({
            studentName: data.data.studentName,
            subject: data.data.subject,
            scanTime: data.data.scanTime,
            status: data.data.status,
          });
        } else {
          playErrorSound();
          setGeneralError(data.error || "Gagal memverifikasi QR Code.");
        }
      } catch (err: unknown) {
        playErrorSound();
        setGeneralError((err as Error).message || "Koneksi ke server gagal.");
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, studentId, currentUser]
  );

  useEffect(() => {
    if (activeTab !== "camera" || successData || duplicateData) return;

    let isMounted = true;
    setCameraError(null);

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              handleVerifyQR(decodedText);
            }
          },
          () => {}
        );
      } catch (err: unknown) {
        if (isMounted) {
          console.warn("Camera start failed", err);
          setCameraError(
            "Kamera tidak dapat diakses atau izin ditolak. Kamu dapat menggunakan opsi Input Token."
          );
        }
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab, successData, duplicateData, handleVerifyQR]);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="p-2.5 rounded-2xl bg-white border border-[#E7E8E8] text-[#7B868F] hover:text-[#191E24] hover:border-[#191E24] transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#191E24] tracking-tight">
              Scan Attendance
            </h1>
            <p className="text-xs text-[#7B868F]">
              {studentName} • Siswa
            </p>
          </div>
        </div>

        <AbelasLogo variant="horizontal" size="xs" />
      </div>

      {/* SUCCESS STATE */}
      {successData ? (
        <div className="saas-card p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-3xl bg-[#F2F6F3] border border-[#D6E2D8] text-[#3B5A42] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#191E24]">
              Absensi Berhasil
            </h2>
            <p className="text-xs text-[#3B5A42] font-semibold mt-1">
              Kehadiran telah tercatat di sistem
            </p>
          </div>

          {/* Newly Enrolled Notice */}
          {successData.newlyEnrolled && successData.className && (
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADBCA] text-left">
              <p className="text-xs font-bold text-[#786134]">
                Pendaftaran Kelas Otomatis Berhasil
              </p>
              <p className="text-[11px] text-[#786134]/90 mt-0.5 leading-relaxed">
                Kamu telah otomatis terdaftar ke <strong>Kelas {successData.className}</strong>.
              </p>
            </div>
          )}

          {/* Details */}
          <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] space-y-2.5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Siswa:</span>
              <span className="font-semibold text-[#191E24]">{successData.studentName}</span>
            </div>
            {successData.className && (
              <div className="flex justify-between">
                <span className="text-[#7B868F]">Kelas:</span>
                <span className="font-semibold text-[#191E24]">Kelas {successData.className}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Mata Pelajaran:</span>
              <span className="font-semibold text-[#191E24]">{successData.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Jam Absen:</span>
              <span className="font-semibold font-mono text-[#191E24]">{successData.scanTime} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Status:</span>
              <span className="font-semibold text-[#3B5A42] uppercase">{successData.status}</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/student")}
            className="w-full saas-btn bg-[#191E24] text-white text-xs font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>
      ) : duplicateData ? (
        /* DUPLICATE ATTENDANCE STATE */
        <div className="saas-card p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 border-[#EADBCA]">
          <div className="h-16 w-16 rounded-3xl bg-[#FAF7F2] border border-[#EADBCA] text-[#786134] flex items-center justify-center mx-auto shadow-xs">
            <Clock className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#191E24]">
              Kamu sudah melakukan absensi
            </h2>
            <p className="text-xs text-[#7B868F] mt-1">
              Satu siswa hanya dapat absen satu kali pada sesi ini.
            </p>
          </div>

          {/* Details */}
          <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] space-y-2.5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Nama:</span>
              <span className="font-semibold text-[#191E24]">{duplicateData.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Jam Absensi:</span>
              <span className="font-semibold font-mono text-[#191E24]">{duplicateData.scanTime} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7B868F]">Mata Pelajaran:</span>
              <span className="font-semibold text-[#191E24]">{duplicateData.subject}</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setDuplicateData(null);
                setGeneralError(null);
              }}
              className="flex-1 saas-btn bg-[#F5F5F5] text-[#191E24] text-xs font-semibold"
            >
              Scan Ulang
            </button>
            <button
              onClick={() => router.push("/student")}
              className="flex-1 saas-btn bg-[#191E24] text-white text-xs font-semibold"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* CAMERA SCANNER VIEW */
        <div className="saas-card p-5 sm:p-6 space-y-4">
          {/* Switch tabs: Camera vs Manual input */}
          <div className="flex rounded-2xl bg-[#F5F5F5] p-1 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab("camera");
                setGeneralError(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "camera"
                  ? "bg-white text-[#191E24] shadow-xs"
                  : "text-[#7B868F] hover:text-[#191E24]"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Kamera HP</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("manual");
                setGeneralError(null);
                if (scannerRef.current && scannerRef.current.isScanning) {
                  scannerRef.current.stop().catch(() => {});
                }
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "manual"
                  ? "bg-white text-[#191E24] shadow-xs"
                  : "text-[#7B868F] hover:text-[#191E24]"
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Input Token</span>
            </button>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="p-3.5 rounded-2xl bg-[#F8F3F3] border border-[#E7D6D6] text-[#7B3F3E] text-xs font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {activeTab === "camera" ? (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCA] text-xs text-[#786134] text-center space-y-2">
                  <p>{cameraError}</p>
                  <button
                    onClick={() => setActiveTab("manual")}
                    className="px-3 py-1.5 rounded-xl bg-[#191E24] text-white font-semibold text-xs"
                  >
                    Gunakan Input Token Manual
                  </button>
                </div>
              ) : (
                /* Scanner Viewfinder with Rounded Rectangle & Subtle Laser Line */
                <div className="relative rounded-[24px] overflow-hidden bg-[#191E24] aspect-square flex items-center justify-center">
                  <div id={scannerElementId} className="w-full h-full" />

                  {/* Laser scan line overlay */}
                  <div className="laser-line pointer-events-none" />

                  {/* Loading indicator if processing scan */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-[#191E24]/85 flex flex-col items-center justify-center text-white text-xs gap-2">
                      <RotateCcw className="h-5 w-5 animate-spin text-[#D6E2D8]" />
                      <span className="font-medium">Memvalidasi kehadiran...</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-center text-xs font-medium text-[#7B868F]">
                Posisikan QR Code di dalam area
              </p>
            </div>
          ) : (
            /* Manual Token Fallback Form */
            <div className="space-y-3 pt-1">
              <p className="text-xs text-[#7B868F]">
                Masukkan token sesi atau URL QR:
              </p>
              <textarea
                rows={3}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Contoh: sec_token_... atau attendance/session/ATT-20260906-001?token=..."
                className="w-full text-xs font-mono p-3 rounded-2xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
              />

              <button
                onClick={() => handleVerifyQR(manualInput)}
                disabled={!manualInput.trim() || isProcessing}
                className="w-full saas-btn bg-[#191E24] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isProcessing ? "Memvalidasi..." : "Verifikasi Absensi"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
