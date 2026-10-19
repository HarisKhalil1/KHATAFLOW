"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";

export default function EditCustomerModal() {
  const { selectedCustomerIdForModal, closeModal, getCustomerWithBalance, updateCustomer } = useDashboard();

  const customer = selectedCustomerIdForModal ? getCustomerWithBalance(selectedCustomerIdForModal) : undefined;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address || "");
      setNotes(customer.notes || "");
    }
  }, [customer]);

  if (!customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError("Customer name must be at least 2 characters.");
      return;
    }

    const cleanedPhone = trimmedPhone.replace(/[\s-]/g, "");
    if (!/^((\+92)|(0092)|(0))?3[0-9]{9}$/.test(cleanedPhone)) {
      setError("Please enter a valid Pakistani mobile number (e.g., 0300-1234567 or 03219876543).");
      return;
    }

    setIsSubmitting(true);
    const result = updateCustomer(customer.id, {
      name: trimmedName,
      phone: trimmedPhone,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to update customer.");
    } else {
      setSuccessMsg(`Customer "${trimmedName}" updated successfully!`);
      setTimeout(() => {
        closeModal();
      }, 1000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-customer-modal-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#EADBCA] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E4D4] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-kf-orange flex items-center justify-center font-bold text-sm">
              ✏️
            </div>
            <div>
              <h2 id="edit-customer-modal-title" className="text-base sm:text-lg font-extrabold text-kf-navy">
                Edit Customer Details
              </h2>
              <p className="text-xs text-[#556B82]">
                Update contact info and notes for {customer.name}
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

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-customer-name" className="block text-xs font-bold text-kf-navy mb-1.5">
              Customer / Shop Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-customer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tariq Khan"
              required
              className="w-full h-11 px-3.5 bg-[#FAF3E8]/50 border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-customer-phone" className="block text-xs font-bold text-kf-navy mb-1.5">
              Mobile Number (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-customer-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0301-5551234"
              required
              className="w-full h-11 px-3.5 bg-[#FAF3E8]/50 border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-customer-address" className="block text-xs font-bold text-kf-navy mb-1.5">
              Address / Area / Shop Location
            </label>
            <input
              id="edit-customer-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Saddar Road, Shop #14, Peshawar"
              className="w-full h-11 px-3.5 bg-[#FAF3E8]/50 border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-customer-notes" className="block text-xs font-bold text-kf-navy mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="edit-customer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or customer preferences..."
              rows={2}
              className="w-full p-3 bg-[#FAF3E8]/50 border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all resize-none"
            />
          </div>

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
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6A00] to-[#FF7E1F] hover:from-[#E85E00] hover:to-[#FF6A00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6A00]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
