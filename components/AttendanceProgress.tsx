import React from "react";

interface AttendanceProgressProps {
  presentCount: number;
  totalCount: number;
  className?: string;
}

export default function AttendanceProgress({
  presentCount,
  totalCount,
  className = "",
}: AttendanceProgressProps) {
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#191E24]">
          {presentCount} / {totalCount} hadir
        </span>
        <span className="font-bold text-[#8C7F24]">{percentage}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-[#EAEAEA] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#9EB47B] to-[#8C7F24]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
