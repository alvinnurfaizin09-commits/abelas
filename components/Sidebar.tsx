"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Users,
  History,
  BarChart3,
  Settings,
  LogOut,
  Camera,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import AbelasLogo from "@/components/AbelasLogo";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, role, logout } = useAuth();

  // Do not render sidebar on login page or if not logged in
  if (pathname === "/login" || !currentUser) {
    return null;
  }

  const isAdmin = role === "admin";

  const adminMenu = [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Attendance / QR", href: "/admin/qr", icon: <QrCode className="h-5 w-5" /> },
    { label: "Daftar Siswa", href: "/admin/students", icon: <Users className="h-5 w-5" /> },
    { label: "Riwayat Sesi", href: "/admin/history", icon: <History className="h-5 w-5" /> },
    { label: "Statistik Guru", href: "/admin/profile", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Pengaturan Jadwal", href: "/admin/schedule", icon: <Settings className="h-5 w-5" /> },
  ];

  const studentMenu = [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Scan QR", href: "/student/scan", icon: <Camera className="h-5 w-5" /> },
    { label: "Riwayat Saya", href: "/student/history", icon: <History className="h-5 w-5" /> },
    { label: "Profil Siswa", href: "/student/profile", icon: <User className="h-5 w-5" /> },
  ];

  const menuItems = isAdmin ? adminMenu : studentMenu;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E7E8E8] h-screen sticky top-0 px-5 py-6 justify-between flex-shrink-0">
      <div className="space-y-6">
        {/* App Branding */}
        <div className="px-1 pt-1">
          <div className="flex items-center justify-between gap-2">
            <Link href={isAdmin ? "/admin" : "/student"} className="flex items-center gap-2.5 group min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white border border-[#E7E8E8] shadow-2xs p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-square.jpg"
                  alt="abelas"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight text-[#191E24] block leading-tight">
                  abelas
                </span>
                <span className="text-[10px] font-semibold text-[#7B868F] uppercase tracking-wider block truncate">
                  Presensi QR
                </span>
              </div>
            </Link>
            <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase bg-[#F5F5F5] text-[#7B868F] border border-[#E7E8E8] shrink-0">
              {isAdmin ? "Guru" : "Siswa"}
            </span>
          </div>
        </div>

        {/* Navigation Menu (Strictly Separated for Admin vs Siswa) */}
        <nav className="space-y-1.5 pt-2">
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#7B868F] block mb-2">
            Menu {isAdmin ? "Admin" : "Siswa"}
          </span>
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#191E24] text-white shadow-xs"
                    : "text-[#7B868F] hover:bg-[#F5F5F5] hover:text-[#191E24]"
                }`}
              >
                <div className={isActive ? "text-[#C2B535]" : "text-[#7B868F]"}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card & Logout Button */}
      <div className="pt-4 border-t border-[#E7E8E8]">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F5F5]/60 border border-[#E7E8E8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[#191E24] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#191E24] truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[#7B868F] truncate">
                {isAdmin ? "Guru / Admin" : "Siswa (XI-D)"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Keluar / Logout"
            className="p-1.5 text-[#7B868F] hover:text-[#7B3F3E] rounded-lg hover:bg-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
