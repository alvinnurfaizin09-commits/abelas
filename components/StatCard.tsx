import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string; // Optional accent border or dot
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[22px] bg-white border border-[#E7E8E8] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
        onClick ? "cursor-pointer hover:border-[#C2B535]" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wide text-[#7B868F] uppercase">
          {title}
        </span>
        {icon && (
          <div className="h-9 w-9 rounded-2xl bg-[#F5F5F5] flex items-center justify-center text-[#191E24]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#191E24] tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <span className="text-xs font-medium text-[#7B868F]">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
