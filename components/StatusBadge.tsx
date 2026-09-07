import React from "react";
import { AttendanceStatus } from "@/lib/db";

interface StatusBadgeProps {
  status: AttendanceStatus | "belum_hadir";
  className?: string;
}

// Refined, muted SaaS colors (matte, elegant, non-glaring)
const statusConfig: Record<
  AttendanceStatus | "belum_hadir",
  { label: string; bg: string; text: string; border: string }
> = {
  hadir: {
    label: "Hadir",
    bg: "bg-[#F2F6F3]",
    text: "text-[#3B5A42]",
    border: "border-[#D6E2D8]",
  },
  terlambat: {
    label: "Terlambat",
    bg: "bg-[#FAF7F2]",
    text: "text-[#786134]",
    border: "border-[#EADBCA]",
  },
  izin: {
    label: "Izin",
    bg: "bg-[#F3F6F8]",
    text: "text-[#3E5266]",
    border: "border-[#D7DFE6]",
  },
  sakit: {
    label: "Sakit",
    bg: "bg-[#F6F4F7]",
    text: "text-[#584D67]",
    border: "border-[#DFD9E5]",
  },
  alpha: {
    label: "Alpha",
    bg: "bg-[#F8F3F3]",
    text: "text-[#7B3F3E]",
    border: "border-[#E7D6D6]",
  },
  belum_hadir: {
    label: "Belum Hadir",
    bg: "bg-[#F5F5F5]",
    text: "text-[#7B868F]",
    border: "border-[#E7E8E8]",
  },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.belum_hadir;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-tight ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
