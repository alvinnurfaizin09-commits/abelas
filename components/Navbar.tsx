"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, UserCheck, Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-800">
              Absensi<span className="text-indigo-600">QR</span>
            </span>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
              Smart Attendance UI
            </span>
          </div>
        </Link>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              !isAdmin
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Siswa</span>
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              isAdmin
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
