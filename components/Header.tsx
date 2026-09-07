"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { LogOut } from "lucide-react";
import AbelasLogo from "@/components/AbelasLogo";

interface HeaderProps {
  greeting?: string;
  userName?: string;
}

export default function Header({ greeting, userName }: HeaderProps) {
  const { currentUser, role, logout } = useAuth();

  const displayName = userName || currentUser?.name || "Alvin";
  const defaultGreeting = greeting || (role === "admin" ? "Selamat Pagi" : "Halo");
  const roleLabel = role === "admin" ? "Wali Kelas / Admin" : "Siswa (XI-D)";

  return (
    <header className="flex flex-col gap-3 pb-5 border-b border-[#E7E8E8]/70">
      {/* Mobile-only Top Brand Bar */}
      <div className="flex lg:hidden items-center justify-between">
        <Link href={role === "admin" ? "/admin" : "/student"} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-white border border-[#E7E8E8] shadow-2xs p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-square.jpg" alt="abelas" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#191E24]">abelas</span>
        </Link>
        <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase bg-white border border-[#E7E8E8] text-[#7B868F]">
          {role === "admin" ? "Portal Guru" : "Portal Siswa"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#7B868F] block">
              {defaultGreeting}
            </span>
            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E7E8E8] text-[#191E24]">
              {roleLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191E24] mt-0.5">
            {displayName}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Profile Avatar */}
          <Link
            href={role === "admin" ? "/admin/profile" : "/student/profile"}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#191E24] border border-[#E7E8E8] shadow-xs flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity"
            title="Lihat Profil"
          >
            {displayName.charAt(0).toUpperCase()}
          </Link>

          {/* Mobile & Desktop Logout Button */}
          <button
            onClick={logout}
            title="Keluar / Logout"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white border border-[#E7E8E8] shadow-2xs flex items-center justify-center text-[#7B868F] hover:text-[#7B3F3E] hover:border-[#7B3F3E]/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
