"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  QrCode,
  History,
  User,
  Camera,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { currentUser, role } = useAuth();

  // Hide bottom nav on login page or if user is not authenticated
  if (pathname === "/login" || !currentUser) {
    return null;
  }

  const isAdmin = role === "admin";

  const adminNav = [
    { label: "Home", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Siswa", href: "/admin/students", icon: <Users className="h-5 w-5" /> },
    {
      label: "QR",
      href: "/admin/qr",
      icon: <QrCode className="h-6 w-6" />,
      isCenter: true,
    },
    { label: "Riwayat", href: "/admin/history", icon: <History className="h-5 w-5" /> },
    { label: "Profil", href: "/admin/profile", icon: <User className="h-5 w-5" /> },
  ];

  const studentNav = [
    { label: "Home", href: "/student", icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      label: "Scan",
      href: "/student/scan",
      icon: <Camera className="h-6 w-6" />,
      isCenter: true,
    },
    { label: "Riwayat", href: "/student/history", icon: <History className="h-5 w-5" /> },
    { label: "Profil", href: "/student/profile", icon: <User className="h-5 w-5" /> },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E8E8] px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200 ${
                    isActive
                      ? "bg-[#191E24] text-[#C2B535] scale-105 shadow-[#191E24]/20 ring-2 ring-[#191E24]"
                      : "bg-[#191E24] text-white hover:scale-105"
                  }`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight ${
                    isActive ? "text-[#191E24]" : "text-[#7B868F]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-[#191E24] font-bold"
                  : "text-[#7B868F] hover:text-[#191E24] font-medium"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? "text-[#191E24]" : "text-[#7B868F]"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
