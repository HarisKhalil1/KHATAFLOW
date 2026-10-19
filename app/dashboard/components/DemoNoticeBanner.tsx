"use client";

import React, { useState } from "react";

export default function DemoNoticeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#FFF4EB] border-b border-[#FFE0CC] px-3 py-1.5 sm:px-6 lg:px-8 text-xs text-[#8A3B00] flex items-center justify-between gap-2 overflow-hidden">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-2 h-2 rounded-full bg-kf-orange flex-shrink-0 animate-pulse" />
        <span className="font-bold truncate text-[11px] sm:text-xs">Phase 1B Demo:</span>
        <span className="hidden sm:inline text-[#9E4D12] truncate text-xs">
          All financial calculations run locally in-memory. Data updates live across screens and resets on full refresh.
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="hidden md:inline-block font-semibold text-[11px] bg-white px-2 py-0.5 rounded-md border border-[#FFD2B3]">
          Khyber General Store (Peshawar)
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[#9E4D12] hover:text-[#522300] font-bold p-1 cursor-pointer transition-colors"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
