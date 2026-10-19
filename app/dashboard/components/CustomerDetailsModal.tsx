"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";
import WhatsAppShareModal from "./WhatsAppShareModal";
import {
  generateBillReceiptText,
  generateLedgerStatementText,
  generateReminderText,
} from "../utils/whatsapp";

interface CustomerDetailsModalProps {
  customerId: string | null;
  onClose: () => void;
}

export default function CustomerDetailsModal({ customerId, onClose }: CustomerDetailsModalProps) {
  const { getCustomerWithBalance, getCustomerLedger, getCustomerBill, openModal, restoreCustomer } = useDashboard();
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    title: string;
    msgEn: string;
    msgUr: string;
  }>({
    isOpen: false,
    title: "",
    msgEn: "",
    msgUr: "",
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && customerId) {
        onClose();
      }
    }
    if (customerId) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customerId, onClose]);

  if (!customerId) return null;

  const customer = getCustomerWithBalance(customerId);
  if (!customer) return null;

  const ledger = getCustomerLedger(customerId);
  const bill = getCustomerBill(customerId);

  const handleShareLedger = () => {
    const totalPurchases = customer.openingBalance + customer.totalCredit;
    const msgEn =
      customer.currentBalance > 0
        ? generateReminderText({
            customerName: customer.name,
            currentBalance: customer.currentBalance,
            lang: "en",
          })
        : generateLedgerStatementText({
            customerName: customer.name,
            totalPurchases,
            totalPaid: customer.totalPaid,
            currentBalance: customer.currentBalance,
            lang: "en",
          });

    const msgUr =
      customer.currentBalance > 0
        ? generateReminderText({
            customerName: customer.name,
            currentBalance: customer.currentBalance,
            lang: "ur",
          })
        : generateLedgerStatementText({
            customerName: customer.name,
            totalPurchases,
            totalPaid: customer.totalPaid,
            currentBalance: customer.currentBalance,
            lang: "ur",
          });

    setWhatsAppModal({
      isOpen: true,
      title:
        customer.currentBalance > 0
          ? "Send Udhaar Reminder on WhatsApp"
          : "Share Ledger Statement on WhatsApp",
      msgEn,
      msgUr,
    });
  };

  const handleShareBill = () => {
    if (!bill) return;
    const items = bill.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    }));
    const msgEn = generateBillReceiptText({
      customerName: customer.name,
      billNo: bill.billNo,
      date: bill.date,
      items,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      remainingBalance: bill.remainingBalance,
      lang: "en",
    });
    const msgUr = generateBillReceiptText({
      customerName: customer.name,
      billNo: bill.billNo,
      date: bill.date,
      items,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      remainingBalance: bill.remainingBalance,
      lang: "ur",
    });
    setWhatsAppModal({
      isOpen: true,
      title: `Share Bill #${bill.billNo} on WhatsApp`,
      msgEn,
      msgUr,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-details-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#EADBCA] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#FCF7F0] border-b border-[#F0E4D4] flex items-start justify-between">
          <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F283E] to-[#1E4B72] text-white flex items-center justify-center font-extrabold text-base shadow-sm flex-shrink-0">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="customer-details-title" className="text-lg sm:text-xl font-extrabold text-kf-navy truncate">
                  {customer.name}
                </h2>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    customer.isArchived
                      ? "bg-slate-100 text-slate-700 border border-slate-300"
                      : customer.currentBalance === 0
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-[#FFF4EB] text-kf-orange border border-[#FFD9B3]"
                  }`}
                >
                  {customer.isArchived ? "Archived Account" : customer.currentBalance === 0 ? "Account Cleared" : "Has Udhaar"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#556B82] mt-1">
                <span className="flex items-center gap-1 font-semibold text-kf-navy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {customer.phone}
                </span>
                <span className="truncate">• {customer.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                openModal("edit-customer", customer.id);
              }}
              title="Edit customer details"
              className="p-1.5 rounded-lg text-[#556B82] hover:bg-[#F0E4D4] hover:text-kf-navy transition-colors cursor-pointer"
            >
              <span className="text-sm">✏️</span>
            </button>

            {/* Archive / Delete Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                openModal("delete-customer", customer.id);
              }}
              title={customer.isArchived ? "Delete permanently" : "Archive or delete customer"}
              className="p-1.5 rounded-lg text-[#556B82] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <span className="text-sm">🗑️</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="p-1.5 rounded-lg text-[#556B82] hover:bg-[#F0E4D4] hover:text-kf-navy transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* If Archived, show banner */}
        {customer.isArchived && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950 font-semibold">
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span>
                Account is <strong>Archived</strong>. New transactions disabled. Ledger history preserved.
              </span>
            </div>
            <button
              type="button"
              onClick={() => restoreCustomer(customer.id)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs self-start sm:self-auto"
            >
              <span>↺</span>
              <span>Restore Customer</span>
            </button>
          </div>
        )}

        {/* Balance Metrics Strip */}
        <div className="grid grid-cols-3 divide-x divide-[#F0E4D4] border-b border-[#F0E4D4] bg-white text-center p-3">
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-[#8DA6BC] tracking-wider block">
              Total Purchases
            </span>
            <span className="text-sm font-extrabold text-kf-navy">
              Rs. {(customer.openingBalance + customer.totalCredit).toLocaleString()}
            </span>
          </div>
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider block">
              Total Paid
            </span>
            <span className="text-sm font-extrabold text-green-700">
              Rs. {customer.totalPaid.toLocaleString()}
            </span>
          </div>
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-kf-orange tracking-wider block">
              Current Due
            </span>
            <span className="text-base font-extrabold text-kf-orange">
              Rs. {customer.currentBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="px-6 py-3 bg-[#FFFDFB] border-b border-[#F0E4D4] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-kf-navy">Khata Actions:</div>
          <div className="flex flex-wrap items-center gap-2">
            {bill && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openModal("item-adjust", customer.id);
                }}
                className="px-3 py-1.5 bg-[#FAF3E8] hover:bg-[#F0E4D4] text-[#8C4B00] border border-[#EADBCA] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                ⚖️ Adjust Bill Item
              </button>
            )}
            <button
              type="button"
              disabled={customer.isArchived}
              onClick={() => {
                onClose();
                openModal("credit", customer.id);
              }}
              title={customer.isArchived ? "Account is archived. Restore to give credit." : undefined}
              className="px-3 py-1.5 bg-[#FFF2E5] hover:bg-[#FFE5CC] disabled:opacity-40 disabled:cursor-not-allowed text-kf-orange text-xs font-bold rounded-lg border border-[#FFD9B3] transition-colors cursor-pointer"
            >
              + Give Credit
            </button>
            <button
              type="button"
              disabled={customer.isArchived || customer.currentBalance <= 0}
              onClick={() => {
                onClose();
                openModal("payment", customer.id);
              }}
              title={customer.isArchived ? "Account is archived. Restore to receive payment." : undefined}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              ↓ Receive Payment
            </button>
            <button
              type="button"
              onClick={handleShareLedger}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>💬</span>
              <span>WhatsApp {customer.currentBalance > 0 ? "Reminder" : "Statement"}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Itemized Bill Protection Breakdown if customer has an original bill */}
          {bill && (
            <div className="p-4 bg-[#FAF3E8] rounded-2xl border border-[#EADBCA]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-kf-orange" />
                  <h3 className="text-xs font-extrabold text-kf-navy uppercase tracking-wider">
                    Original Source Bill #{bill.billNo}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#556B82]">
                    Total: Rs. {bill.totalAmount.toLocaleString()} • Paid: Rs. {bill.paidAmount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={handleShareBill}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>💬</span>
                    <span>WhatsApp Bill</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#556B82] mb-3">
                Protected item ledger: adjustments and allocations reconcile item-by-item against these exact lines.
              </p>

              <div className="space-y-2">
                {bill.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 bg-white rounded-xl border border-[#F0E4D4] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-kf-navy">{it.name}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF3E8] text-[#556B82]">
                          {it.quantity} {it.unit} @ Rs. {it.unitPrice.toLocaleString()}/{it.unit}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#556B82] mt-0.5">
                        Line Total: Rs. {it.lineTotal.toLocaleString()} • Paid:{" "}
                        <span className="text-green-700 font-bold">Rs. {it.paidAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8DA6BC] uppercase font-bold block">
                        Remaining Due
                      </span>
                      <span
                        className={`font-extrabold ${
                          it.remainingBalance === 0 ? "text-green-600" : "text-kf-orange"
                        }`}
                      >
                        {it.remainingBalance === 0 ? "✓ Cleared (Rs. 0)" : `Rs. ${it.remainingBalance.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ledger History List */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-kf-navy pb-2">
              <span>Transaction Ledger History</span>
              <span className="text-[11px] text-[#556B82] font-semibold">
                Opening Balance: Rs. {customer.openingBalance.toLocaleString()}
              </span>
            </div>

            {ledger.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#556B82] bg-[#FAF3E8] rounded-2xl border border-[#EADBCA] p-6">
                No transactions recorded yet for this customer.
              </div>
            ) : (
              <div className="space-y-2">
                {ledger.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-[#F0E4D4] bg-[#FCF8F2] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            tx.type === "credit"
                              ? "bg-orange-100 text-kf-orange"
                              : tx.type === "adjustment"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {tx.type === "credit"
                            ? "Udhaar Given"
                            : tx.type === "adjustment"
                            ? "Item Adjustment"
                            : "Payment Received"}
                        </span>
                        <span className="text-[11px] text-[#8DA6BC] font-medium">{tx.date}</span>
                        {tx.receiptNo && (
                          <span className="text-[10px] text-[#8DA6BC]">#{tx.receiptNo}</span>
                        )}
                        {tx.paymentMethod && (
                          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#EADBCA] text-[#556B82]">
                            {tx.paymentMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-kf-navy font-semibold truncate">{tx.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div
                        className={`font-extrabold ${
                          tx.type === "credit"
                            ? "text-kf-orange"
                            : tx.type === "adjustment"
                            ? "text-amber-700"
                            : "text-green-600"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "-"} Rs. {tx.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#556B82]">
                        Bal: Rs. {tx.runningBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FCF7F0] border-t border-[#F0E4D4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-kf-navy hover:bg-[#163B5C] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* WhatsApp Share Modal */}
        <WhatsAppShareModal
          isOpen={whatsAppModal.isOpen}
          onClose={() => setWhatsAppModal((prev) => ({ ...prev, isOpen: false }))}
          customerName={customer.name}
          customerPhone={customer.phone}
          title={whatsAppModal.title}
          initialMessageEn={whatsAppModal.msgEn}
          initialMessageUr={whatsAppModal.msgUr}
        />
      </div>
    </div>
  );
}
