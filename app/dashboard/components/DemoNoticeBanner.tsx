"use client";

import React, { useState } from "react";
import { useShopRegistry } from "../../context/ShopRegistryContext";

export default function DemoNoticeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { activeShop } = useShopRegistry();

  if (dismissed) return null;

  return (
    <div className={`border-b px-3 py-1.5 sm:px-6 lg:px-8 text-xs flex items-center justify-between gap-2 overflow-hidden ${
      activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS"
        ? "bg-amber-50 border-amber-200 text-amber-950"
        : "bg-[#FFF4EB] border-[#FFE0CC] text-[#8A3B00]"
    }`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${
          activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS" ? "bg-amber-600" : "bg-kf-orange"
        }`} />
        <span className="font-bold truncate text-[11px] sm:text-xs">
          {activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS"
            ? "DEMO TEST SHOP:"
            : "Active Store Workspace:"}
        </span>
        <span className="hidden sm:inline truncate text-xs font-medium">
          {activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS"
            ? "Haris Khan Demo Store — Permanent demo account with 3 sample customers, credit bills, payments & expenses for testing."
            : "Isolated local ledger active. All customer debts, items, and payments are safely saved in browser storage."}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`inline-flex items-center gap-1 font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md border truncate max-w-[240px] ${
          activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS"
            ? "bg-amber-200/60 text-amber-900 border-amber-300"
            : "bg-white text-kf-navy border-[#FFD2B3]"
        }`}>
          {activeShop?.isDemoCreated || activeShop?.id === "SHOP-PK-HARIS" ? "🧪 " : ""}
          {activeShop ? `${activeShop.name} (${activeShop.id})` : "KhataFlow Shop"}
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
