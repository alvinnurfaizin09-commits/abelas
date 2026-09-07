import React from "react";
import StatusBadge from "./StatusBadge";
import { AttendanceStatus } from "@/lib/db";
import { Trash2 } from "lucide-react";

interface StudentRowProps {
  name: string;
  studentNumber: string;
  time: string;
  status: AttendanceStatus | "belum_hadir";
  notes?: string;
  classNameTag?: string;
  onClick?: () => void;
  onDelete?: () => void;
  isClickable?: boolean;
}

export default function StudentRow({
  name,
  studentNumber,
  time,
  status,
  notes,
  classNameTag,
  onClick,
  onDelete,
  isClickable = false,
}: StudentRowProps) {
  // Get 2-letter initial (e.g. "Andi Nugraha" -> "AN")
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`rounded-[18px] bg-white border border-[#E7E8E8] p-3.5 flex items-center justify-between gap-3 transition-all duration-150 ${
        isClickable
          ? "cursor-pointer hover:border-[#C2B535]/80 hover:shadow-xs"
          : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-2xl bg-[#F5F5F5] border border-[#E7E8E8] flex items-center justify-center font-bold text-xs text-[#191E24] flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#191E24] truncate">{name}</p>
            {classNameTag && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F5F5] border border-[#E7E8E8] text-[#191E24]">
                {classNameTag}
              </span>
            )}
          </div>
          <p className="text-xs text-[#7B868F] truncate">
            NIS: {studentNumber} {notes ? `• ${notes}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="text-xs font-mono font-medium text-[#7B868F] hidden sm:inline">
          {time}
        </span>
        <StatusBadge status={status} />
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-xl text-[#7B868F] hover:text-[#7B3F3E] hover:bg-[#F8F3F3] border border-transparent hover:border-[#E7D6D6] transition-colors"
            title="Hapus Siswa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

