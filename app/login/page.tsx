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
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import AbelasLogo from "@/components/AbelasLogo";
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  signInWithEmailAndPassword,
  getFirebaseErrorMessage,
} from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, role, isLoading: authLoading, loginWithUser, isFirebaseActive } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<"student" | "admin">("student");
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reg = params.get("registered");
      if (reg) {
        setIdentifier(reg);
        setPassword("");
        setSuccessBanner(`Akun ${reg} berhasil didaftarkan! Masukkan kata sandi Anda untuk masuk.`);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading && currentUser) {
      if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/student");
      }
    }
  }, [currentUser, role, authLoading, router]);

  const switchTab = (tab: "student" | "admin") => {
    setActiveRoleTab(tab);
    setError(null);
    setIdentifier("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const isFb = isFirebaseConfigured();
      if (isFb) {
        let emailToAuth = identifier.trim();

        // If user entered NIS or NIP, resolve email first
        if (!emailToAuth.includes("@")) {
          const resolveRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: emailToAuth,
              resolve_email_only: true,
            }),
          });
          const resolveData = await resolveRes.json();
          if (!resolveRes.ok || !resolveData.success || !resolveData.email) {
            setError(resolveData.error || "NIS/NIP tidak ditemukan di database sekolah.");
            setLoading(false);
            return;
          }
          emailToAuth = resolveData.email;
        }

        const auth = getFirebaseAuth();
        if (!auth) {
          throw new Error("Layanan Firebase Auth gagal diinisialisasi.");
        }

        let fbUid: string;
        try {
          const cred = await signInWithEmailAndPassword(auth, emailToAuth, password.trim());
          fbUid = cred.user.uid;
        } catch (fbErr: any) {
          setError(getFirebaseErrorMessage(fbErr));
          setLoading(false);
          return;
        }

        // Sync and get full profile from DB
        const syncRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailToAuth,
            firebase_uid: fbUid,
          }),
        });
        const syncData = await syncRes.json();

        if (syncRes.ok && syncData.success && syncData.user) {
          if (syncData.user.role !== activeRoleTab) {
            setError(
              activeRoleTab === "admin"
                ? "Akun ini terdaftar sebagai Siswa, silakan beralih ke tab Login Siswa."
                : "Akun ini terdaftar sebagai Guru/Admin, silakan beralih ke tab Login Admin."
            );
            setLoading(false);
            return;
          }

          loginWithUser(syncData.user);

          if (syncData.user.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/student");
          }
          return;
        } else {
          setError(syncData.error || "Gagal menyinkronkan profil akun.");
          setLoading(false);
          return;
        }
      }

      // Fallback: Standard database credential login when Firebase keys are not set
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        // Enforce that student cannot login via admin tab and vice versa
        if (data.user.role !== activeRoleTab) {
          setError(
            activeRoleTab === "admin"
              ? "Akun ini terdaftar sebagai Siswa, silakan beralih ke tab Login Siswa."
              : "Akun ini terdaftar sebagai Guru/Admin, silakan beralih ke tab Login Admin."
          );
          setLoading(false);
          return;
        }

        loginWithUser(data.user);

        if (data.user.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/student");
        }
      } else {
        setError(data.error || "Login gagal. Periksa kembali data Anda.");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Terjadi gangguan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md saas-card p-6 sm:p-8 space-y-5">
        {/* Branding with abelas Logo */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-1 pb-1">
          <div className="p-4 rounded-3xl bg-white border border-[#E7E8E8] shadow-xs flex items-center justify-center">
            <AbelasLogo variant="square" size="lg" />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-xs font-semibold text-[#191E24]">
              Sistem Presensi Kelas Digital
            </p>
            <p className="text-[11px] text-[#7B868F]">
              Pilih peran Anda untuk masuk ke sistem
            </p>
          </div>
        </div>

        {/* Tab Switcher: Siswa vs Admin */}
        <div className="flex rounded-2xl bg-[#F5F5F5] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchTab("student")}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === "student"
                ? "bg-white text-[#191E24] shadow-xs"
                : "text-[#7B868F] hover:text-[#191E24]"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Login Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab("admin")}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeRoleTab === "admin"
                ? "bg-white text-[#191E24] shadow-xs"
                : "text-[#7B868F] hover:text-[#191E24]"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Login Admin / Guru</span>
          </button>
        </div>

        {/* Success registration banner */}
        {successBanner && (
          <div className="p-3.5 rounded-2xl bg-[#F2F6F3] border border-[#D6E2D8] text-[#3B5A42] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#3B5A42]" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-[#F8F3F3] border border-[#E7D6D6] text-[#7B3F3E] text-xs font-medium space-y-1.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes("tidak ditemukan") && (
              <div className="pt-1 pl-6">
                <Link
                  href="/register"
                  className="font-bold text-[#191E24] hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#C2B535]" />
                  <span>Daftar akun baru di sini</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#7B868F]" />
              {activeRoleTab === "student" ? "NIS atau Email Siswa" : "NIP atau Email Guru"}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                activeRoleTab === "student"
                  ? "20261001 atau nama@siswa.sch.id"
                  : "NIP-19880906 atau admin@sekolah.sch.id"
              }
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191E24] mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#7B868F]" />
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E7E8E8] bg-[#F5F5F5]/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191E24] text-[#191E24]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full saas-btn bg-[#191E24] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#C2B535]" />
            ) : (
              <span>Masuk sebagai {activeRoleTab === "admin" ? "Guru / Admin" : "Siswa"}</span>
            )}
          </button>
        </form>

        {/* Register link callout */}
        <div className="pt-2 text-center">
          <p className="text-xs text-[#7B868F]">
            Belum memiliki akun resmi?{" "}
            <Link
              href="/register"
              className="font-bold text-[#191E24] hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#C2B535]" />
              <span>Daftar Akun Baru</span>
            </Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#7B868F]">
          <Shield className="h-3.5 w-3.5 text-[#C2B535]" />
          <span>
            {isFirebaseConfigured()
              ? "Dilindungi oleh Google Firebase Authentication"
              : "Sistem Presensi Terenkripsi"}
          </span>
        </div>
      </div>
    </div>
  );
}
