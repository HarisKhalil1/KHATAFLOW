"use client";

import React from "react";
import Link from "next/link";
import { RegisteredShop, useShopRegistry } from "../../context/ShopRegistryContext";

interface SuspensionLockScreenProps {
  shop: RegisteredShop;
  reason?: string;
  expiresAt?: string;
}

export default function SuspensionLockScreen({
  shop,
  reason,
  expiresAt,
}: SuspensionLockScreenProps) {
  const { restoreShop } = useShopRegistry();

  const [isExpired, setIsExpired] = React.useState(false);
  React.useEffect(() => {
    if (expiresAt) {
      setIsExpired(Date.now() >= new Date(expiresAt).getTime());
    }
  }, [expiresAt]);

  return (
    <div className="min-h-screen bg-[#FAF3E8] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-200 text-center space-y-5 animate-in fade-in duration-200">
        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-3xl font-bold shadow-xs">
          ⏸️
        </div>

        {/* Title */}
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider">
            Shop Temporarily Suspended
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-kf-navy mt-3">
            {shop.name}
          </h1>
          <p className="text-xs text-[#556B82] font-mono mt-0.5">
            Shop ID: {shop.id} • {shop.city}
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200/80 text-left text-xs space-y-2 text-red-950">
          <div>
            <span className="font-bold block text-red-900">Administrative Suspension Reason:</span>
            <span className="text-red-800 leading-relaxed block mt-0.5">
              {reason || "Temporary administrative hold applied by Super Admin."}
            </span>
          </div>

          {expiresAt && (
            <div className="pt-2 border-t border-red-200/60 text-[11px] text-red-800">
              <strong>Scheduled Expiry:</strong> {new Date(expiresAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Data Safety Guarantee */}
        <div className="p-3.5 bg-green-50/70 rounded-2xl border border-green-200/70 text-left text-xs text-green-950 flex items-start gap-2.5">
          <span className="text-green-600 font-bold text-base leading-none">🛡️</span>
          <div>
            <strong className="text-green-900 block font-extrabold">Data Integrity Preserved:</strong>
            <span className="text-green-800 text-[11px] leading-tight block mt-0.5">
              Your customers, bills, transactions, payments, and ledger history are completely safe and untouched. Suspension only restricts active operations until resolved.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          {isExpired ? (
            <button
              type="button"
              onClick={() => restoreShop(shop.id)}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Suspension Expired — Click to Unlock Shop
            </button>
          ) : (
            <Link
              href="/superadmin"
              className="block w-full py-3 bg-[#0F283E] hover:bg-[#1A3D5D] text-white font-bold text-xs rounded-xl shadow-xs transition-colors no-underline"
            >
              Open Super Admin Console (To Manage or Reactivate)
            </Link>
          )}

          <Link
            href="/"
            className="block w-full py-2.5 bg-[#F5ECE1] hover:bg-[#EADBCA] text-kf-navy font-bold text-xs rounded-xl transition-colors no-underline text-center"
          >
            ← Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
