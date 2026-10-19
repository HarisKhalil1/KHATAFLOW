/**
 * KhataFlow Manual WhatsApp Sharing Utility
 * Formats polite, professional Urdu and English messages
 * Normalizes Pakistani phone numbers to international wa.me format (e.g. 923001234567)
 */

export function normalizePakistaniPhone(phone: string): string {
  if (!phone) return "";
  // Strip all non-digits
  const digits = phone.replace(/\D/g, "");

  // If starts with 03 (e.g. 03011234567 - 11 digits)
  if (digits.startsWith("03") && digits.length === 11) {
    return "92" + digits.slice(1);
  }

  // If starts with 3 (e.g. 3011234567 - 10 digits)
  if (digits.startsWith("3") && digits.length === 10) {
    return "92" + digits;
  }

  // If already starts with 923 (e.g. 923011234567 - 12 digits)
  if (digits.startsWith("92") && digits.length === 12) {
    return digits;
  }

  // If starts with 0092
  if (digits.startsWith("0092") && digits.length === 14) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidPakistaniPhone(phone: string): boolean {
  const normalized = normalizePakistaniPhone(phone);
  // Must be 12 digits starting with 923
  return /^923\d{9}$/.test(normalized);
}

export interface BillItemSummary {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export function generateBillReceiptText({
  shopName = "Khyber General Store",
  customerName,
  billNo,
  date,
  items,
  totalAmount,
  paidAmount,
  remainingBalance,
  lang = "en",
}: {
  shopName?: string;
  customerName: string;
  billNo: string;
  date: string;
  items: BillItemSummary[];
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  lang?: "en" | "ur";
}): string {
  if (lang === "ur") {
    let msg = `*${shopName}* — رسید بل\n`;
    msg += `محترم ${customerName} صاحب، السلام علیکم\n`;
    msg += `بل نمبر: #${billNo} | تاریخ: ${date}\n\n`;
    msg += `*تفصیل اشیاء:*\n`;

    items.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.name} (${it.quantity} ${it.unit} @ روپے ${it.unitPrice.toLocaleString()}) = روپے ${it.lineTotal.toLocaleString()}\n`;
    });

    msg += `\n*کل رقم:* روپے ${totalAmount.toLocaleString()}`;
    if (paidAmount > 0) {
      msg += `\n*وصول شدہ:* روپے ${paidAmount.toLocaleString()}`;
    }
    msg += `\n*بقایا رقم:* روپے ${remainingBalance.toLocaleString()}\n\n`;
    msg += `آپ کے تعاون کا شکریہ!\n_کھاتہ فلو کے ذریعے بھیجا گیا_`;
    return msg;
  }

  // English
  let msg = `*${shopName}* — Purchase Bill\n`;
  msg += `Dear ${customerName},\n`;
  msg += `Bill #: #${billNo} | Date: ${date}\n\n`;
  msg += `*Purchased Items:*\n`;

  items.forEach((it, idx) => {
    msg += `${idx + 1}. ${it.name} (${it.quantity} ${it.unit} @ Rs. ${it.unitPrice.toLocaleString()}) = Rs. ${it.lineTotal.toLocaleString()}\n`;
  });

  msg += `\n*Total Amount:* Rs. ${totalAmount.toLocaleString()}`;
  if (paidAmount > 0) {
    msg += `\n*Paid Amount:* Rs. ${paidAmount.toLocaleString()}`;
  }
  msg += `\n*Remaining Balance:* Rs. ${remainingBalance.toLocaleString()}\n\n`;
  msg += `Thank you for your business!\n_Sent via KhataFlow_`;
  return msg;
}

export function generatePaymentReceiptText({
  shopName = "Khyber General Store",
  customerName,
  receiptNo,
  date,
  amountPaid,
  newBalance,
  paymentMethod = "Cash",
  lang = "en",
}: {
  shopName?: string;
  customerName: string;
  receiptNo: string;
  date: string;
  amountPaid: number;
  newBalance: number;
  paymentMethod?: string;
  lang?: "en" | "ur";
}): string {
  if (lang === "ur") {
    let msg = `*${shopName}* — وصولی رسید\n`;
    msg += `محترم ${customerName} صاحب، السلام علیکم\n`;
    msg += `رسید نمبر: #${receiptNo} | تاریخ: ${date}\n\n`;
    msg += `ہمیں آپ کی طرف سے *روپے ${amountPaid.toLocaleString()}* وصول پا چکے ہیں۔\n`;
    msg += `طریقہ ادائیگی: ${paymentMethod}\n`;
    msg += `*نیا بقایا کھاتہ:* روپے ${newBalance.toLocaleString()}\n\n`;
    msg += `بروقت ادائیگی کا بہت شکریہ!\n_کھاتہ فلو کے ذریعے بھیجا گیا_`;
    return msg;
  }

  let msg = `*${shopName}* — Payment Receipt\n`;
  msg += `Dear ${customerName},\n`;
  msg += `Receipt #: #${receiptNo} | Date: ${date}\n\n`;
  msg += `We have received your payment of *Rs. ${amountPaid.toLocaleString()}*.\n`;
  msg += `Payment Method: ${paymentMethod}\n`;
  msg += `*Remaining Udhaar Balance:* Rs. ${newBalance.toLocaleString()}\n\n`;
  msg += `Thank you for your timely payment!\n_Sent via KhataFlow_`;
  return msg;
}

export function generateLedgerStatementText({
  shopName = "Khyber General Store",
  customerName,
  totalPurchases,
  totalPaid,
  currentBalance,
  lang = "en",
}: {
  shopName?: string;
  customerName: string;
  totalPurchases: number;
  totalPaid: number;
  currentBalance: number;
  lang?: "en" | "ur";
}): string {
  const dateStr = new Date().toISOString().split("T")[0];

  if (lang === "ur") {
    let msg = `*${shopName}* — کھاتہ اسٹیٹمنٹ\n`;
    msg += `محترم ${customerName} صاحب، السلام علیکم\n`;
    msg += `تاریخ: ${dateStr}\n\n`;
    msg += `آپ کے کھاتہ کی تفصیل درج ذیل ہے:\n`;
    msg += `• کل خریداری: روپے ${totalPurchases.toLocaleString()}\n`;
    msg += `• کل ادا شدہ رقم: روپے ${totalPaid.toLocaleString()}\n`;
    msg += `• *موجودہ بقایا ادھار:* روپے ${currentBalance.toLocaleString()}\n\n`;
    msg += `کسی بھی سوال کی صورت میں ہم سے رابطہ کریں۔\n_کھاتہ فلو کے ذریعے بھیجا گیا_`;
    return msg;
  }

  let msg = `*${shopName}* — Account Ledger Statement\n`;
  msg += `Dear ${customerName},\n`;
  msg += `Date: ${dateStr}\n\n`;
  msg += `Here is your current account summary:\n`;
  msg += `• Total Purchases: Rs. ${totalPurchases.toLocaleString()}\n`;
  msg += `• Total Paid: Rs. ${totalPaid.toLocaleString()}\n`;
  msg += `• *Current Outstanding Balance:* Rs. ${currentBalance.toLocaleString()}\n\n`;
  msg += `Please reach out if you have any questions.\n_Sent via KhataFlow_`;
  return msg;
}

export function generateReminderText({
  shopName = "Khyber General Store",
  customerName,
  currentBalance,
  lang = "en",
}: {
  shopName?: string;
  customerName: string;
  currentBalance: number;
  lang?: "en" | "ur";
}): string {
  if (lang === "ur") {
    let msg = `*${shopName}* — یاد دہانی برائے ادھار ادائیگی\n`;
    msg += `محترم ${customerName} صاحب، السلام علیکم\n\n`;
    msg += `یہ ایک برادرانہ یاد دہانی ہے کہ آپ کے کھاتہ میں *روپے ${currentBalance.toLocaleString()}* بقایا ہیں۔\n`;
    msg += `براہ کرم سہولت کے مطابق ادائیگی کر دیں تاکہ لین دین میں آسانی رہے۔\n\n`;
    msg += `آپ کے تعاون کا شکریہ!\n_کھاتہ فلو_`;
    return msg;
  }

  let msg = `*${shopName}* — Friendly Payment Reminder\n`;
  msg += `Dear ${customerName},\n\n`;
  msg += `This is a friendly reminder regarding your outstanding udhaar balance of *Rs. ${currentBalance.toLocaleString()}* at ${shopName}.\n`;
  msg += `Kindly clear the balance at your earliest convenience.\n\n`;
  msg += `Thank you for your continuous support!\n_KhataFlow_`;
  return msg;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const normalized = normalizePakistaniPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (normalized) {
    return `https://wa.me/${normalized}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
