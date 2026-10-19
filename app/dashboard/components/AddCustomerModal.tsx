"use client";

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function AddCustomerModal() {
  const { closeModal, addCustomer } = useDashboard();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError("Customer name must be at least 2 characters.");
      return;
    }

    // Pakistani phone format: 03xx-xxxxxxx or 03xxxxxxxxx or +923xxxxxxxxx
    const cleanedPhone = trimmedPhone.replace(/[\s-]/g, "");
    if (!/^((\+92)|(0092)|(0))?3[0-9]{9}$/.test(cleanedPhone)) {
      setError("Please enter a valid Pakistani mobile number (e.g., 0300-1234567 or 03219876543).");
      return;
    }

    const openBal = parseFloat(openingBalance) || 0;
    if (openBal < 0) {
      setError("Opening balance cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    const result = addCustomer({
      name: trimmedName,
      phone: trimmedPhone,
      address: address.trim() || undefined,
      openingBalance: openBal,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to add customer.");
    } else {
      setSuccessMsg(`Customer "${trimmedName}" successfully added!`);
      setTimeout(() => {
        closeModal();
      }, 1100);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-customer-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h2 id="add-customer-title" className="text-lg font-extrabold text-kf-navy">
                Add New Customer
              </h2>
              <p className="text-xs text-[#556B82]">
                Create a khata ledger profile for a new customer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#556B82] hover:bg-[#F5ECE1] hover:text-kf-navy transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Success Feedback */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label htmlFor="customer-name-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Customer Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customer-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Haji Gul Khan (Khyber Mart)"
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="customer-phone-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="customer-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              placeholder="0300-1234567"
              required
              className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
            <p className="text-[10px] text-[#556B82] mt-1">Pakistani format: 0300-1234567</p>
          </div>

          {/* Opening Balance & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="customer-balance-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Existing Balance (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#8DA6BC]">
                  Rs.
                </span>
                <input
                  id="customer-balance-input"
                  type="number"
                  step="any"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 pl-10 pr-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="customer-address-input" className="block text-xs font-bold text-kf-navy mb-1.5">
                Address / Shop Location
              </label>
              <input
                id="customer-address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Saddar Bazaar, Peshawar"
                className="w-full h-11 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="customer-notes-input" className="block text-xs font-bold text-kf-navy mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="customer-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekly settlement on Thursday, trusted customer"
              className="w-full p-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E4D4]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-kf-navy hover:bg-[#F5ECE1] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Creating..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
