"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import confetti from "canvas-confetti";
import {
  X,
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  Sparkles,
} from "lucide-react";
import { playSuccessSound, playErrorSound } from "@/lib/sound";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  onSuccessAttendance: (data: {
    className: string;
    time: string;
    date: string;
    isExtraDay: boolean;
  }) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  onSuccessAttendance,
}: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      className: string;
      time: string;
      date: string;
    };
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "interactive-qr-reader";

  // Trigger confetti animation
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if confetti fails
    }
  };

  // Submit scan / verify token
  const handleVerifyToken = async (rawCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setVerificationResult(null);

    try {
      const res = await fetch("/api/qr/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: rawCode.trim(),
          studentName,
          studentId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playSuccessSound();
        triggerConfetti();
        setVerificationResult({
          success: true,
          message: data.message || "Presensi Berhasil Dicatat!",
          details: {
            className: data.record.className,
            time: data.time,
            date: data.formattedDate,
          },
        });

        onSuccessAttendance({
          className: data.record.className,
          time: data.time,
          date: data.formattedDate,
          isExtraDay: data.isExtraDay,
        });

        // Stop camera if running
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      } else {
        playErrorSound();
        setVerificationResult({
          success: false,
          message: data.error || "Gagal memproses QR code.",
        });
      }
    } catch (err: unknown) {
      playErrorSound();
      setVerificationResult({
        success: false,
        message: (err as Error).message || "Koneksi ke server gagal.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start Html5Qrcode camera
  useEffect(() => {
    if (!isOpen || activeTab !== "camera" || verificationResult?.success) return;

    let isMounted = true;
    setCameraError(null);

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              handleVerifyToken(decodedText);
            }
          },
          () => {
            // scan frame error, ignore
          }
        );
      } catch (err: unknown) {
        if (isMounted) {
          console.warn("Camera start failed, switching to fallback:", err);
          setCameraError(
            "Kamera tidak dapat diakses atau izin ditolak. Anda dapat menggunakan opsi Input Kode Manual di bawah."
          );
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      }
    };
  }, [isOpen, activeTab, verificationResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Scan QR Presensi</h3>
            <p className="text-xs text-slate-500">
              Siswa: <span className="font-semibold text-indigo-600">{studentName}</span> ({studentId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-2xl bg-slate-100 p-1 my-3 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("camera");
              setVerificationResult(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === "camera"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Kamera Scan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("manual");
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === "manual"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Input Kode / Tempel</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-2">
          {verificationResult?.success ? (
            /* Success Card */
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h4 className="text-lg font-black text-emerald-900">
                Presensi Berhasil!
              </h4>
              <p className="text-xs text-emerald-700 mt-1">
                {verificationResult.message}
              </p>

              {verificationResult.details && (
                <div className="w-full mt-4 p-4 rounded-2xl bg-white border border-emerald-200 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Kelas:</span>
                    <span className="font-bold text-slate-800">
                      {verificationResult.details.className}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Waktu:</span>
                    <span className="font-bold text-slate-800">
                      {verificationResult.details.time} WIB
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Tanggal:</span>
                    <span className="font-bold text-slate-800">
                      {verificationResult.details.date}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full mt-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                Selesai & Tutup
              </button>
            </div>
          ) : (
            <div>
              {/* Error feedback if any */}
              {verificationResult && !verificationResult.success && (
                <div className="mb-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Gagal Presensi</p>
                    <p className="mt-0.5">{verificationResult.message}</p>
                  </div>
                </div>
              )}

              {activeTab === "camera" ? (
                <div>
                  {cameraError ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center space-y-2">
                      <p>{cameraError}</p>
                      <button
                        onClick={() => setActiveTab("manual")}
                        className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs"
                      >
                        Beralih ke Input Manual
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center">
                      <div id={readerElementId} className="w-full h-full" />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white text-xs gap-2">
                          <RotateCcw className="h-6 w-6 animate-spin text-indigo-400" />
                          <span>Memvalidasi token QR...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-center text-[11px] text-slate-400 mt-3">
                    Arahkan kamera ke kode QR di layar proyektor Admin.
                  </p>
                </div>
              ) : (
                /* Manual Input Form */
                <div className="space-y-4 py-2">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Masukkan atau tempelkan token QR dari admin (misal saat kamera sedang tidak tersedia atau pengujian).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Token QR / JSON
                    </label>
                    <textarea
                      rows={3}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Contoh: qr_12345678... atau format JSON dari QR"
                      className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>

                  <button
                    onClick={() => handleVerifyToken(manualCode)}
                    disabled={!manualCode.trim() || isProcessing}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        <span>Memvalidasi...</span>
                      </>
                    ) : (
                      <span>Verifikasi & Presensi</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
