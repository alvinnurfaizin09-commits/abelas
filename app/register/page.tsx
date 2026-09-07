"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  UserCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  Hash,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import AbelasLogo from "@/components/AbelasLogo";
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  getFirebaseErrorMessage,
} from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<"student" | "admin">("student");
  const [name, setName] = useState<string>("");
  const [identifier, setIdentifier] = useState<string>(""); // NIS or NIP
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Live Email Verification State
  const [emailCheck, setEmailCheck] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    message?: string;
  }>({ status: "idle" });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (!authLoading && currentUser) {
      router.replace(currentUser.role === "admin" ? "/admin" : "/student");
    }
  }, [currentUser, authLoading, router]);

  const handleRoleChange = (role: "student" | "admin") => {
    setActiveRoleTab(role);
    setError(null);
    setSuccessMsg(null);
  };

  // Live Email Validation when user leaves email input
  const handleEmailBlur = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailCheck({ status: "idle" });
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setEmailCheck({
        status: "invalid",
        message: "Format email tidak lengkap (contoh: nama@domain.com).",
      });
      return;
    }

    setEmailCheck({ status: "checking", message: "Memeriksa keaslian domain email..." });

    try {
      const res = await fetch("/api/auth/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setEmailCheck({
          status: "valid",
          message: "Email valid & server email aktif terdaftar di internet.",
        });
      } else {
        setEmailCheck({
          status: "invalid",
          message: data.error || "Domain email tidak terdaftar atau email asal-asalan.",
        });
      }
    } catch {
      setEmailCheck({ status: "idle" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!name.trim() || name.trim().length < 3) {
      setError("Nama lengkap wajib diisi minimal 3 karakter.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Masukkan alamat email yang valid dan aktif.");
      return;
    }

    if (emailCheck.status === "invalid") {
      setError(emailCheck.message || "Alamat email tidak valid. Harap gunakan email asli.");
      return;
    }

    if (!identifier.trim() || identifier.trim().length < 4) {
      setError(
        activeRoleTab === "admin"
          ? "NIP wajib diisi minimal 4 karakter."
          : "NIS wajib diisi minimal 4 karakter."
      );
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter demi keamanan akun.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok dengan kata sandi di atas.");
      return;
    }

    setLoading(true);

    try {
      let fbUid: string | undefined = undefined;

      // 1. If Firebase Auth is configured, register user in Firebase Auth
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth();
        if (auth) {
          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              email.trim(),
              password
            );
            fbUid = userCredential.user.uid;

            // Send verification email
            try {
              await sendEmailVerification(userCredential.user);
            } catch (verErr) {
              console.warn("Could not send verification email:", verErr);
            }
          } catch (fbErr: any) {
            setError(getFirebaseErrorMessage(fbErr));
            setLoading(false);
            return;
          }
        }
      }

      // 2. Save school user profile into database
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          student_number: identifier.trim(),
          password,
          role: activeRoleTab,
          firebase_uid: fbUid,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("Akun berhasil didaftarkan! Mengalihkan ke halaman masuk...");
        setTimeout(() => {
          router.push(`/login?registered=${encodeURIComponent(email.trim())}`);
        }, 1200);
      } else {
        setError(data.error || "Pendaftaran gagal. Silakan periksa kembali data Anda.");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md saas-card p-6 sm:p-8 space-y-5 bg-white shadow-lg border border-[#E7E8E8]">
        {/* Branding with abelas Logo */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-1 pb-1">
          <div className="p-4 rounded-3xl bg-white border border-[#E7E8E8] shadow-xs flex items-center justify-center">
            <AbelasLogo variant="square" size="lg" />
          </div>
          <div className="text-center space-y-0.5">
            <h1 className="text-base font-bold text-[#191E24]">
              Pendaftaran Akun Baru
            </h1>
            <p className="text-[11px] text-[#7B868F]">
              Wajib menggunakan email asli yang aktif & terdaftar
            </p>
          </div>
        </div>

        {/* Role Selector Switcher */}
        <div className="flex rounded-2xl bg-[#F5F5F5] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleChange("student")}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === "student"
                ? "bg-white text-[#191E24] shadow-xs"
                : "text-[#7B868F] hover:text-[#191E24]"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Daftar Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === "admin"
                ? "bg-white text-[#191E24] shadow-xs"
                : "text-[#7B868F] hover:text-[#191E24]"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Daftar Guru / Admin</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-[#F8F3F3] border border-[#E7D6D6] text-[#7B3F3E] text-xs font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-[#F2F6F3] border border-[#D6E2D8] text-[#3B5A42] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#3B5A42]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Informative Box: Automatic Class Enrollment for Students */}
        {activeRoleTab === "student" && (
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADBCA] text-[#786134] text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-[#191E24]">
              <QrCode className="h-4 w-4 text-[#C2B535]" />
              <span>Kelas Terdaftar Otomatis via QR</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#786134]">
              Siswa tidak perlu memilih kelas saat mendaftar. Kelas Anda akan otomatis terdaftar dan terkunci saat pertama kali Anda memindai (scan) QR Code sesi presensi guru di kelas.
            </p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#7B868F]" />
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Muhammad Alvin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          {/* Email with Live Verification */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#191E24] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#7B868F]" />
                Email Aktif (Bukan Email Asal)
              </label>
              {emailCheck.status === "checking" && (
                <span className="text-[10px] text-[#7B868F] flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Memeriksa MX...
                </span>
              )}
            </div>

            <input
              type="email"
              required
              placeholder="contoh: nama.asli@gmail.com atau nama@sekolah.sch.id"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailCheck.status !== "idle") setEmailCheck({ status: "idle" });
              }}
              onBlur={handleEmailBlur}
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 text-[#191E24] transition-colors ${
                emailCheck.status === "valid"
                  ? "border-[#D6E2D8] focus:ring-[#3B5A42]"
                  : emailCheck.status === "invalid"
                  ? "border-[#E7D6D6] focus:ring-[#7B3F3E]"
                  : "border-[#E7E8E8] focus:ring-[#191E24]"
              }`}
            />

            {/* Email Status Feedback */}
            {emailCheck.status === "valid" && (
              <p className="text-[11px] text-[#3B5A42] font-semibold mt-1 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                <span>{emailCheck.message}</span>
              </p>
            )}

            {emailCheck.status === "invalid" && (
              <p className="text-[11px] text-[#7B3F3E] font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{emailCheck.message}</span>
              </p>
            )}
          </div>

          {/* Student/Staff Number */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-[#7B868F]" />
              {activeRoleTab === "student" ? "NIS (Nomor Induk Siswa)" : "NIP (Nomor Induk Pegawai)"}
            </label>
            <input
              type="text"
              required
              placeholder={activeRoleTab === "student" ? "Contoh: 20261050" : "Contoh: NIP-19900101"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#7B868F]" />
              Kata Sandi (Minimal 6 karakter)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#7B868F]" />
              Ulangi Kata Sandi
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || emailCheck.status === "invalid"}
            className="w-full saas-btn bg-[#191E24] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#C2B535]" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Daftar Akun</span>
                <ArrowRight className="h-4 w-4 text-[#C2B535]" />
              </div>
            )}
          </button>
        </form>

        {/* Link back to login */}
        <div className="pt-3 border-t border-[#E7E8E8] text-center space-y-2">
          <p className="text-xs text-[#7B868F]">
            Sudah memiliki akun terdaftar?{" "}
            <Link
              href="/login"
              className="font-bold text-[#191E24] hover:underline"
            >
              Masuk di sini
            </Link>
          </p>

          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-[#7B868F]">
            <Shield className="h-3.5 w-3.5 text-[#C2B535]" />
            <span>
              {isFirebaseConfigured()
                ? "Dilindungi oleh Google Firebase Authentication"
                : "Sistem Pendaftaran Terenkripsi"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
