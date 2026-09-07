import React from "react";

interface ClassBadgeProps {
  name: string;
  isExtra?: boolean;
}

export default function ClassBadge({ name, isExtra = false }: ClassBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
        {name}
      </span>
      {isExtra && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          Tambahan
        </span>
      )}
    </div>
  );
}
