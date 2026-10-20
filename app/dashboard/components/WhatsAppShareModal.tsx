"use client";

import React, { useState } from "react";
import { normalizePakistaniPhone, isValidPakistaniPhone, getWhatsAppUrl } from "../utils/whatsapp";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  title: string;
  initialMessageEn: string;
  initialMessageUr: string;
}

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  title,
  initialMessageEn,
  initialMessageUr,
}: WhatsAppShareModalProps) {
  const [lang, setLang] = useState<"en" | "ur">("ur");
  const [editedPhone, setEditedPhone] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const phone = editedPhone ?? customerPhone;
  const message = editedMessage ?? (lang === "ur" ? initialMessageUr : initialMessageEn);

  if (!isOpen) return null;

  const normalizedPhone = normalizePakistaniPhone(phone);
  const isValidPhone = isValidPakistaniPhone(phone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenWhatsApp = () => {
    const url = getWhatsAppUrl(phone, message);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-[#EADBCA] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0E4D4] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              💬
            </div>
            <div>
              <h2 id="whatsapp-modal-title" className="text-base font-extrabold text-kf-navy">
                {title}
              </h2>
              <p className="text-xs text-[#556B82]">
                Recipient: <strong className="text-kf-navy">{customerName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#556B82] hover:bg-[#F5ECE1] hover:text-kf-navy transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Phone Number Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="wa-phone-input" className="font-bold text-kf-navy">
                Customer Phone Number
              </label>
              {isValidPhone ? (
                <span className="text-[10px] text-green-700 font-bold">
                  ✓ Valid (wa.me/{normalizedPhone})
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-semibold">
                  Note: Pakistani mobile e.g. 0301-1234567
                </span>
              )}
            </div>
            <input
              id="wa-phone-input"
              type="text"
              value={phone}
              onChange={(e) => setEditedPhone(e.target.value)}
              placeholder="03001234567"
              className="w-full h-10 px-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-semibold text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all"
            />
          </div>

          {/* Language Toggle for Message */}
          <div className="flex items-center justify-between bg-[#FAF3E8] p-2 rounded-xl border border-[#EADBCA]">
            <span className="text-xs font-bold text-kf-navy">Message Template Language:</span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#EADBCA]">
              <button
                type="button"
                onClick={() => {
                  setLang("ur");
                  setEditedMessage(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  lang === "ur" ? "bg-emerald-600 text-white shadow-2xs" : "text-[#556B82] hover:text-kf-navy"
                }`}
              >
                اردو (Urdu)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  setEditedMessage(null);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  lang === "en" ? "bg-emerald-600 text-white shadow-2xs" : "text-[#556B82] hover:text-kf-navy"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="wa-message-textarea" className="font-bold text-kf-navy">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-kf-orange font-bold hover:underline cursor-pointer"
              >
                {copied ? "✓ Copied to clipboard!" : "Copy Text"}
              </button>
            </div>
            <textarea
              id="wa-message-textarea"
              rows={8}
              dir={lang === "ur" ? "rtl" : "ltr"}
              value={message}
              onChange={(e) => setEditedMessage(e.target.value)}
              className={`w-full p-3 bg-[#FCF7F0] border border-[#EADBCA] rounded-xl text-xs font-medium text-kf-navy focus:bg-white focus:border-kf-orange focus:ring-1 focus:ring-kf-orange outline-none transition-all resize-none leading-relaxed ${
                lang === "ur" ? "font-urdu" : "font-sans"
              }`}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0E4D4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-kf-navy hover:bg-[#F5ECE1] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-kf-navy border border-[#EADBCA] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {copied ? "Copied!" : "Copy Text"}
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Open in WhatsApp</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
