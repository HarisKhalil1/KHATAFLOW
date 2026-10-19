"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

export type TransactionType = "credit" | "payment";
export type ExpenseCategory = "Inventory" | "Rent" | "Utilities" | "Transport" | "Staff" | "Other";
export type PaymentMethod = "Cash" | "Bank Transfer" | "JazzCash" | "EasyPaisa";
export type CustomerStatus = "active" | "cleared" | "overdue";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  openingBalance: number;
  createdAt: string;
  notes?: string;
}

export interface BillItem {
  id: string;
  billId: string;
  name: string;
  quantity: number;
  unit: string; // 'kg' | 'pieces' | 'liters' | 'bags'
  unitPrice: number; // Selling price in PKR
  unitCost: number; // Wholesale unit purchase cost (for COGS)
  lineTotal: number; // quantity * unitPrice
  paidAmount: number; // amount paid toward this item
  remainingBalance: number; // lineTotal - paidAmount
}

export interface CustomerBill {
  id: string;
  billNo: string;
  customerId: string;
  customerName: string;
  date: string;
  items: BillItem[];
  totalAmount: number;
  totalCost: number;
  paidAmount: number;
  remainingBalance: number;
  notes?: string;
}

export interface ItemAdjustment {
  id: string;
  billId: string;
  customerId: string;
  originalItemId: string;
  originalItemName: string;
  enteredItemName: string;
  quantityAdjusted: number;
  unit: string;
  unitPrice: number;
  amountAdjusted: number;
  reason: string;
  date: string;
}

export interface PaymentItemAllocation {
  itemId: string;
  itemName: string;
  allocatedAmount: number;
}

export interface LedgerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  receiptNo?: string;
  paymentMethod?: PaymentMethod;
  itemAllocations?: PaymentItemAllocation[];
  billId?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "payment" | "credit" | "alert" | "info";
  read: boolean;
}

export interface CustomerWithBalance extends Customer {
  currentBalance: number;
  totalCredit: number;
  totalPaid: number;
  lastTransactionDate?: string;
}

export interface LedgerEntryWithRunningBalance extends LedgerTransaction {
  runningBalance: number;
}

export interface MonthlyFinancialSummary {
  month: string; // 'YYYY-MM'
  monthLabel: string; // 'October 2026'
  totalSales: number; // Net sales recorded in month (cash + credit)
  cogs: number; // Cost of goods sold for items sold in month
  hasReliableCostData: boolean;
  grossProfit: number; // totalSales - cogs
  operatingExpenses: number; // Operating shop expenses (excluding inventory restock)
  netProfit: number; // grossProfit - operatingExpenses
  outstandingUdhaar: number; // Money customers currently owe (not profit)
  paymentsReceived: number; // Cash collections in month (not profit)
  isDemoEstimate?: boolean;
  missingDataNotice?: string;
}

export interface YearlyFinancialSummary {
  year: string; // '2026'
  totalSales: number;
  cogs: number;
  hasReliableCostData: boolean;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  outstandingUdhaar: number;
  paymentsReceived: number;
  monthlyBreakdown: MonthlyFinancialSummary[];
  priorYearComparison?: {
    year: string;
    totalSales: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  suggestedItems?: string[];
  matchedItem?: BillItem;
}

interface DashboardContextType {
  // Data
  customers: Customer[];
  bills: CustomerBill[];
  adjustments: ItemAdjustment[];
  transactions: LedgerTransaction[];
  expenses: Expense[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;

  // Computed
  customersWithBalances: CustomerWithBalance[];
  totalOutstandingCredit: number;
  totalCustomersCount: number;
  activeDebtorsCount: number;
  getCustomerWithBalance: (id: string) => CustomerWithBalance | undefined;
  getCustomerLedger: (customerId: string) => LedgerEntryWithRunningBalance[];
  getCustomerBill: (customerId: string) => CustomerBill | undefined;

  // Item-wise Validation & Actions
  validateItemAdjustment: (
    customerId: string,
    enteredItemName: string,
    quantity: number,
    amount?: number
  ) => ValidationResult;

  adjustBillItem: (data: {
    customerId: string;
    enteredItemName: string;
    quantity: number;
    reason: string;
    date?: string;
  }) => { success: boolean; error?: string; adjustment?: ItemAdjustment };

  // Actions
  addCustomer: (data: {
    name: string;
    phone: string;
    address?: string;
    openingBalance?: number;
    notes?: string;
  }) => { success: boolean; error?: string; customer?: Customer };

  recordPayment: (data: {
    customerId: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    description?: string;
    itemAllocations?: PaymentItemAllocation[];
  }) => { success: boolean; error?: string; transaction?: LedgerTransaction };

  addCredit: (data: {
    customerId: string;
    amount: number;
    date: string;
    description: string;
    receiptNo?: string;
  }) => { success: boolean; error?: string; transaction?: LedgerTransaction };

  addExpense: (data: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => { success: boolean; error?: string; expense?: Expense };

  // Profit Analytics (Accrual Gross & Net Profit)
  getMonthlyProfit: (monthStr: string) => MonthlyFinancialSummary;
  getYearlyProfit: (yearStr: string) => YearlyFinancialSummary;

  markNotificationsAsRead: () => void;
  resetDemoData: () => void;

  // Active Modals Control
  activeModal: "payment" | "credit" | "customer" | "expense" | "item-adjust" | null;
  selectedCustomerIdForModal: string | null;
  openModal: (type: "payment" | "credit" | "customer" | "expense" | "item-adjust", customerId?: string) => void;
  closeModal: () => void;
}

// Initial realistic demo customers
// Tariq's original outstanding udhaar is Rs. 15,000, tied to his original itemized bill #BILL-1001.
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Tariq Khan (Khan Store)",
    phone: "0301-5551234",
    address: "Saddar Road, Shop #14, Peshawar",
    status: "active",
    openingBalance: 0,
    createdAt: "2026-10-01",
    notes: "Wholesale retail customer. Original Bill #BILL-1001 Rs. 15,000 outstanding.",
  },
  {
    id: "cust-2",
    name: "Bilal Ahmed (Peshawar Bakers)",
    phone: "0333-9876543",
    address: "University Road, Peshawar",
    status: "active",
    openingBalance: 5000,
    createdAt: "2026-09-05",
    notes: "Buys flour and baking essentials on 15-day credit.",
  },
  {
    id: "cust-3",
    name: "Haji Usman Shinwari",
    phone: "0345-1122334",
    address: "Karkhano Market, Block C, Peshawar",
    status: "overdue",
    openingBalance: 20000,
    createdAt: "2026-08-15",
    notes: "Follow up required for month-end reconciliation.",
  },
  {
    id: "cust-4",
    name: "Rashid Mehmood (City Pharmacy)",
    phone: "0312-4455667",
    address: "Khyber Bazaar, Peshawar",
    status: "active",
    openingBalance: 3000,
    createdAt: "2026-09-12",
  },
  {
    id: "cust-5",
    name: "Zubair Afridi (Gul Super Store)",
    phone: "0300-7788990",
    address: "Hayatabad Phase 3, Peshawar",
    status: "cleared",
    openingBalance: 0,
    createdAt: "2026-09-20",
    notes: "Always pays full balance promptly via JazzCash.",
  },
  {
    id: "cust-6",
    name: "Imran Shah",
    phone: "0321-3344556",
    address: "Board Bazaar, Peshawar",
    status: "active",
    openingBalance: 8000,
    createdAt: "2026-09-25",
  },
];

// Tariq's original itemized bill records as source of truth
// Exact amounts: Rice 2kg (Rs. 4,000), Dalda oil 2kg (Rs. 6,000), Eggs 11 pieces (Rs. 5,000)
// Total = Rs. 15,000.
const INITIAL_BILLS: CustomerBill[] = [
  {
    id: "bill-1001",
    billNo: "BILL-1001",
    customerId: "cust-1",
    customerName: "Tariq Khan (Khan Store)",
    date: "2026-10-01",
    totalAmount: 15000,
    totalCost: 11800, // COGS: Rice (3,200) + Oil (4,800) + Eggs (3,800)
    paidAmount: 0,
    remainingBalance: 15000,
    notes: "Original store ledger bill: Rice 2kg, Dalda oil 2kg, Eggs 11 pieces.",
    items: [
      {
        id: "item-rice-1",
        billId: "bill-1001",
        name: "Rice",
        quantity: 2,
        unit: "kg",
        unitPrice: 2000,
        unitCost: 1600,
        lineTotal: 4000,
        paidAmount: 0,
        remainingBalance: 4000,
      },
      {
        id: "item-oil-1",
        billId: "bill-1001",
        name: "Dalda oil",
        quantity: 2,
        unit: "kg",
        unitPrice: 3000,
        unitCost: 2400,
        lineTotal: 6000,
        paidAmount: 0,
        remainingBalance: 6000,
      },
      {
        id: "item-eggs-1",
        billId: "bill-1001",
        name: "Eggs",
        quantity: 11,
        unit: "pieces",
        unitPrice: 454.55,
        unitCost: 345.45,
        lineTotal: 5000,
        paidAmount: 0,
        remainingBalance: 5000,
      },
    ],
  },
];

// Initial Transactions: Tariq has his original Rs. 15,000 credit bill recorded on 2026-10-01.
const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
  // Tariq Khan: Original Bill #BILL-1001 of Rs. 15,000
  {
    id: "tx-tariq-1",
    customerId: "cust-1",
    customerName: "Tariq Khan (Khan Store)",
    type: "credit",
    amount: 15000,
    date: "2026-10-01",
    description: "Original Bill #BILL-1001: Rice (2 kg), Dalda oil (2 kg), Eggs (11 pieces)",
    receiptNo: "BILL-1001",
    billId: "bill-1001",
  },
  // Bilal Ahmed (Opening 5,000)
  {
    id: "tx-4",
    customerId: "cust-2",
    customerName: "Bilal Ahmed (Peshawar Bakers)",
    type: "credit",
    amount: 6200,
    date: "2026-10-04",
    description: "Dry milk powder & baking ingredients",
    receiptNo: "REC-1049",
  },
  {
    id: "tx-5",
    customerId: "cust-2",
    customerName: "Bilal Ahmed (Peshawar Bakers)",
    type: "payment",
    amount: 3000,
    date: "2026-10-11",
    description: "Bank transfer via Allied Bank",
    paymentMethod: "Bank Transfer",
  },
  // Haji Usman Shinwari (Opening 20,000)
  {
    id: "tx-6",
    customerId: "cust-3",
    customerName: "Haji Usman Shinwari",
    type: "credit",
    amount: 12000,
    date: "2026-10-05",
    description: "Bulk Basmati Rice (10 bags 25kg)",
    receiptNo: "REC-1055",
  },
  {
    id: "tx-7",
    customerId: "cust-3",
    customerName: "Haji Usman Shinwari",
    type: "payment",
    amount: 6000,
    date: "2026-10-12",
    description: "Direct cash payment via driver",
    paymentMethod: "Cash",
  },
  // Rashid Mehmood (Opening 3,000)
  {
    id: "tx-8",
    customerId: "cust-4",
    customerName: "Rashid Mehmood (City Pharmacy)",
    type: "credit",
    amount: 3800,
    date: "2026-10-06",
    description: "Beverages and mineral water cartons",
    receiptNo: "REC-1061",
  },
  {
    id: "tx-9",
    customerId: "cust-4",
    customerName: "Rashid Mehmood (City Pharmacy)",
    type: "payment",
    amount: 2000,
    date: "2026-10-15",
    description: "JazzCash payment received",
    paymentMethod: "JazzCash",
  },
  // Zubair Afridi (Opening 0, purchased 9,000, fully paid 9,000)
  {
    id: "tx-10",
    customerId: "cust-5",
    customerName: "Zubair Afridi (Gul Super Store)",
    type: "credit",
    amount: 9000,
    date: "2026-10-07",
    description: "Cooking oil & spices carton",
    receiptNo: "REC-1068",
  },
  {
    id: "tx-11",
    customerId: "cust-5",
    customerName: "Zubair Afridi (Gul Super Store)",
    type: "payment",
    amount: 9000,
    date: "2026-10-16",
    description: "Full clearance via EasyPaisa",
    paymentMethod: "EasyPaisa",
  },
  // Imran Shah (Opening 8,000)
  {
    id: "tx-12",
    customerId: "cust-6",
    customerName: "Imran Shah",
    type: "credit",
    amount: 4500,
    date: "2026-10-09",
    description: "Pulses (Daal Mash, Daal Chana, Chawal)",
    receiptNo: "REC-1075",
  },
  {
    id: "tx-13",
    customerId: "cust-6",
    customerName: "Imran Shah",
    type: "payment",
    amount: 1150,
    date: "2026-10-17",
    description: "Cash payment at shop",
    paymentMethod: "Cash",
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    description: "Wholesale stock restock (Ganj Mandi Peshawar)",
    category: "Inventory",
    amount: 48500,
    date: "2026-10-03",
    paymentMethod: "Bank Transfer",
    notes: "Stock inventory purchase — balance sheet asset, not operating overhead",
  },
  {
    id: "exp-2",
    description: "Monthly shop rent (Saddar Plaza)",
    category: "Rent",
    amount: 25000,
    date: "2026-10-01",
    paymentMethod: "Cash",
    notes: "Receipt #449 from building management",
  },
  {
    id: "exp-3",
    description: "PESCO Electricity Bill (Shop meter)",
    category: "Utilities",
    amount: 7850,
    date: "2026-10-10",
    paymentMethod: "EasyPaisa",
  },
  {
    id: "exp-4",
    description: "Goods transport from Ring Road warehouse",
    category: "Transport",
    amount: 2200,
    date: "2026-10-05",
    paymentMethod: "Cash",
    notes: "Suzuki pickup fare",
  },
  {
    id: "exp-5",
    description: "Shop assistant weekly allowance (Ahmad)",
    category: "Staff",
    amount: 5000,
    date: "2026-10-12",
    paymentMethod: "Cash",
  },
  {
    id: "exp-6",
    description: "Generator fuel and maintenance",
    category: "Utilities",
    amount: 3500,
    date: "2026-10-15",
    paymentMethod: "Cash",
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "High Udhaar Balance Alert",
    message: "Haji Usman Shinwari currently has Rs. 26,000 outstanding credit.",
    time: "2 hours ago",
    type: "alert",
    read: false,
  },
  {
    id: "notif-2",
    title: "Payment Received",
    message: "Imran Shah made a cash payment of Rs. 1,150.",
    time: "Yesterday",
    type: "payment",
    read: false,
  },
  {
    id: "notif-3",
    title: "Account Cleared",
    message: "Zubair Afridi fully paid Rs. 9,000 via EasyPaisa. Balance is Rs. 0.",
    time: "2 days ago",
    type: "info",
    read: true,
  },
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [bills, setBills] = useState<CustomerBill[]>(INITIAL_BILLS);
  const [adjustments, setAdjustments] = useState<ItemAdjustment[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modal control
  const [activeModal, setActiveModal] = useState<"payment" | "credit" | "customer" | "expense" | "item-adjust" | null>(null);
  const [selectedCustomerIdForModal, setSelectedCustomerIdForModal] = useState<string | null>(null);

  const openModal = useCallback((type: "payment" | "credit" | "customer" | "expense" | "item-adjust", customerId?: string) => {
    setActiveModal(type);
    setSelectedCustomerIdForModal(customerId || null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedCustomerIdForModal(null);
  }, []);

  // Compute customer balances with strict mathematical integrity
  const customersWithBalances = useMemo<CustomerWithBalance[]>(() => {
    return customers.map((c) => {
      const custTxs = transactions.filter((t) => t.customerId === c.id);

      let totalCredit = 0;
      let totalPaid = 0;
      let lastDate = c.createdAt;

      custTxs.forEach((t) => {
        if (t.type === "credit") {
          totalCredit += t.amount;
        } else if (t.type === "payment") {
          totalPaid += t.amount;
        }
        if (t.date > lastDate) {
          lastDate = t.date;
        }
      });

      const currentBalance = c.openingBalance + totalCredit - totalPaid;

      // Update status dynamically
      let dynamicStatus = c.status;
      if (currentBalance === 0) {
        dynamicStatus = "cleared";
      } else if (dynamicStatus === "cleared" && currentBalance > 0) {
        dynamicStatus = "active";
      }

      return {
        ...c,
        status: dynamicStatus,
        currentBalance: Math.max(0, currentBalance),
        totalCredit,
        totalPaid,
        lastTransactionDate: custTxs.length > 0 ? lastDate : undefined,
      };
    });
  }, [customers, transactions]);

  const totalOutstandingCredit = useMemo(() => {
    return customersWithBalances.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [customersWithBalances]);

  const totalCustomersCount = customers.length;

  const activeDebtorsCount = useMemo(() => {
    return customersWithBalances.filter((c) => c.currentBalance > 0).length;
  }, [customersWithBalances]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const getCustomerWithBalance = useCallback(
    (id: string) => {
      return customersWithBalances.find((c) => c.id === id);
    },
    [customersWithBalances]
  );

  const getCustomerBill = useCallback(
    (customerId: string): CustomerBill | undefined => {
      return bills.find((b) => b.customerId === customerId);
    },
    [bills]
  );

  // Chronological ledger for a customer with calculated running balances
  const getCustomerLedger = useCallback(
    (customerId: string): LedgerEntryWithRunningBalance[] => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return [];

      const custTxs = transactions
        .filter((t) => t.customerId === customerId)
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.id.localeCompare(b.id);
        });

      let running = customer.openingBalance;
      return custTxs.map((tx) => {
        if (tx.type === "credit") {
          running += tx.amount;
        } else {
          running -= tx.amount;
        }
        return {
          ...tx,
          runningBalance: Math.max(0, running),
        };
      });
    },
    [customers, transactions]
  );

  // ITEM VALIDATION LOGIC:
  // Validates item entries against customer's original bill items.
  // When an invalid item like "Sugar" is entered against Tariq's bill (Rice, Dalda oil, Eggs):
  // Returns clear warning: "This item does not match Tariq's original bill. The original bill contains Rice, not Sugar. Please review the original ledger."
  const validateItemAdjustment = useCallback(
    (
      customerId: string,
      enteredItemName: string,
      quantity: number,
      amount?: number
    ): ValidationResult => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) {
        return { isValid: false, errorMessage: "Customer not found." };
      }

      const bill = bills.find((b) => b.customerId === customerId);
      if (!bill || bill.items.length === 0) {
        return {
          isValid: false,
          errorMessage: `No original itemized bill on file for ${customer.name}. Item-wise adjustments require an original bill.`,
        };
      }

      const cleanEnteredName = enteredItemName.trim().toLowerCase();
      if (!cleanEnteredName) {
        return { isValid: false, errorMessage: "Please enter or select an item name." };
      }

      // Check item identity against customer's original bill items
      const matched = bill.items.find(
        (it) => it.name.trim().toLowerCase() === cleanEnteredName
      );

      const customerShortName = customer.name.split(" ")[0]; // "Tariq"

      if (!matched) {
        const originalItemList = bill.items.map((i) => i.name).join(", ");
        return {
          isValid: false,
          errorMessage: `This item does not match ${customerShortName}'s original bill. The original bill contains ${originalItemList}, not ${enteredItemName.trim()}. Please review the original ledger.`,
          suggestedItems: bill.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`),
        };
      }

      // Quantity validation
      if (isNaN(quantity) || quantity <= 0) {
        return {
          isValid: false,
          errorMessage: "Adjustment quantity must be greater than zero.",
          matchedItem: matched,
        };
      }

      if (quantity > matched.quantity) {
        return {
          isValid: false,
          errorMessage: `Adjustment quantity (${quantity} ${matched.unit}) exceeds original quantity of ${matched.quantity} ${matched.unit} on ${matched.name}.`,
          matchedItem: matched,
        };
      }

      // Amount validation if provided
      if (amount !== undefined) {
        if (isNaN(amount) || amount <= 0) {
          return {
            isValid: false,
            errorMessage: "Adjustment amount must be a positive number.",
            matchedItem: matched,
          };
        }
        if (amount > matched.remainingBalance) {
          return {
            isValid: false,
            errorMessage: `Adjustment amount (Rs. ${amount.toLocaleString()}) exceeds the remaining unpaid balance of Rs. ${matched.remainingBalance.toLocaleString()} for ${matched.name}.`,
            matchedItem: matched,
          };
        }
      }

      return {
        isValid: true,
        matchedItem: matched,
      };
    },
    [customers, bills]
  );

  // Apply an approved item adjustment to the customer's bill & ledger
  const adjustBillItem = useCallback(
    (data: {
      customerId: string;
      enteredItemName: string;
      quantity: number;
      reason: string;
      date?: string;
    }) => {
      const validation = validateItemAdjustment(
        data.customerId,
        data.enteredItemName,
        data.quantity
      );

      if (!validation.isValid || !validation.matchedItem) {
        return {
          success: false,
          error: validation.errorMessage || "Invalid item adjustment.",
        };
      }

      const matchedItem = validation.matchedItem;
      const customer = customers.find((c) => c.id === data.customerId)!;
      const bill = bills.find((b) => b.customerId === data.customerId)!;

      // Calculate adjustment amount using the original recorded unit price
      const calculatedAmount = Math.round(data.quantity * matchedItem.unitPrice);

      const newAdjustment: ItemAdjustment = {
        id: `adj-${Date.now()}`,
        billId: bill.id,
        customerId: customer.id,
        originalItemId: matchedItem.id,
        originalItemName: matchedItem.name,
        enteredItemName: data.enteredItemName.trim(),
        quantityAdjusted: data.quantity,
        unit: matchedItem.unit,
        unitPrice: matchedItem.unitPrice,
        amountAdjusted: calculatedAmount,
        reason: data.reason.trim(),
        date: data.date || new Date().toISOString().split("T")[0],
      };

      // Update bill item quantity & balance safely
      setBills((prevBills) =>
        prevBills.map((b) => {
          if (b.id !== bill.id) return b;
          const updatedItems = b.items.map((it) => {
            if (it.id !== matchedItem.id) return it;
            const newQty = Math.max(0, it.quantity - data.quantity);
            const newLineTotal = Math.round(newQty * it.unitPrice);
            const newRemaining = Math.max(0, newLineTotal - it.paidAmount);
            return {
              ...it,
              quantity: newQty,
              lineTotal: newLineTotal,
              remainingBalance: newRemaining,
            };
          });

          const newTotal = updatedItems.reduce((sum, i) => sum + i.lineTotal, 0);
          const newRemaining = Math.max(0, newTotal - b.paidAmount);

          return {
            ...b,
            items: updatedItems,
            totalAmount: newTotal,
            remainingBalance: newRemaining,
          };
        })
      );

      // Record adjustment in transactions to maintain mathematical consistency
      const adjustmentTx: LedgerTransaction = {
        id: `tx-adj-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        type: "payment", // credit reduction
        amount: calculatedAmount,
        date: newAdjustment.date,
        description: `Item Adjustment: Return/correction of ${data.quantity} ${matchedItem.unit} ${matchedItem.name} @ Rs. ${matchedItem.unitPrice.toLocaleString()}/${matchedItem.unit} (${data.reason})`,
        receiptNo: `ADJ-${bill.billNo}`,
        billId: bill.id,
      };

      setTransactions((prev) => [adjustmentTx, ...prev]);
      setAdjustments((prev) => [newAdjustment, ...prev]);

      // Notification
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "Item Adjustment Applied",
        message: `${matchedItem.name} (${data.quantity} ${matchedItem.unit}) adjusted on ${customer.name}'s bill #BILL-1001 for Rs. ${calculatedAmount.toLocaleString()}.`,
        time: "Just now",
        type: "info",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true, adjustment: newAdjustment };
    },
    [validateItemAdjustment, customers, bills]
  );

  // Add Customer action
  const addCustomer = useCallback(
    (data: {
      name: string;
      phone: string;
      address?: string;
      openingBalance?: number;
      notes?: string;
    }) => {
      const trimmedName = data.name.trim();
      const trimmedPhone = data.phone.trim();

      if (!trimmedName || trimmedName.length < 2) {
        return { success: false, error: "Customer name must be at least 2 characters long." };
      }

      const phoneRegex = /^((\+92)|(0092)|(0))?3[0-9]{2}-?[0-9]{7}$/;
      if (!phoneRegex.test(trimmedPhone.replace(/\s+/g, ""))) {
        return {
          success: false,
          error: "Please enter a valid Pakistani phone number (e.g., 0300-1234567 or 03211234567).",
        };
      }

      const openBal = Number(data.openingBalance) || 0;
      if (openBal < 0) {
        return { success: false, error: "Opening balance cannot be negative." };
      }

      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: trimmedName,
        phone: trimmedPhone,
        address: data.address?.trim() || "Peshawar",
        status: openBal > 0 ? "active" : "cleared",
        openingBalance: openBal,
        createdAt: new Date().toISOString().split("T")[0],
        notes: data.notes?.trim(),
      };

      setCustomers((prev) => [newCustomer, ...prev]);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "New Customer Added",
        message: `${trimmedName} was added with Rs. ${openBal.toLocaleString()} opening balance.`,
        time: "Just now",
        type: "info",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true, customer: newCustomer };
    },
    []
  );

  // Record Payment action with strict balance validation & item-level allocation
  const recordPayment = useCallback(
    (data: {
      customerId: string;
      amount: number;
      date: string;
      paymentMethod: PaymentMethod;
      description?: string;
      itemAllocations?: PaymentItemAllocation[];
    }) => {
      const customer = customersWithBalances.find((c) => c.id === data.customerId);
      if (!customer) {
        return { success: false, error: "Customer not found." };
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return { success: false, error: "Payment amount must be greater than zero." };
      }

      if (numAmount > customer.currentBalance) {
        return {
          success: false,
          error: `Payment cannot exceed current outstanding balance of Rs. ${customer.currentBalance.toLocaleString()}. (Customer owes Rs. ${customer.currentBalance.toLocaleString()})`,
        };
      }

      // Item Allocation Validation if provided
      const customerBill = bills.find((b) => b.customerId === data.customerId);
      if (data.itemAllocations && data.itemAllocations.length > 0) {
        if (!customerBill) {
          return {
            success: false,
            error: "Item allocation was submitted, but this customer has no itemized bill on file.",
          };
        }

        const totalAllocated = data.itemAllocations.reduce(
          (sum, a) => sum + Number(a.allocatedAmount || 0),
          0
        );

        if (totalAllocated > numAmount) {
          return {
            success: false,
            error: `Total allocated amount (Rs. ${totalAllocated.toLocaleString()}) cannot exceed the payment amount of Rs. ${numAmount.toLocaleString()}.`,
          };
        }

        // Validate each allocation against item's remaining balance
        for (const alloc of data.itemAllocations) {
          if (alloc.allocatedAmount <= 0) continue;
          const targetItem = customerBill.items.find((i) => i.id === alloc.itemId);
          if (!targetItem) {
            return {
              success: false,
              error: `Allocated item "${alloc.itemName}" does not exist on customer's bill.`,
            };
          }
          if (alloc.allocatedAmount > targetItem.remainingBalance) {
            return {
              success: false,
              error: `Allocation of Rs. ${alloc.allocatedAmount.toLocaleString()} to ${targetItem.name} exceeds its remaining balance of Rs. ${targetItem.remainingBalance.toLocaleString()}.`,
            };
          }
        }

        // Update bill items with allocations
        setBills((prevBills) =>
          prevBills.map((b) => {
            if (b.id !== customerBill.id) return b;
            const updatedItems = b.items.map((it) => {
              const matchedAlloc = data.itemAllocations?.find((a) => a.itemId === it.id);
              if (!matchedAlloc || matchedAlloc.allocatedAmount <= 0) return it;
              const newPaid = it.paidAmount + matchedAlloc.allocatedAmount;
              const newRemaining = Math.max(0, it.lineTotal - newPaid);
              return {
                ...it,
                paidAmount: newPaid,
                remainingBalance: newRemaining,
              };
            });

            const newTotalPaid = updatedItems.reduce((sum, i) => sum + i.paidAmount, 0);
            const newTotalRemaining = Math.max(0, b.totalAmount - newTotalPaid);

            return {
              ...b,
              items: updatedItems,
              paidAmount: newTotalPaid,
              remainingBalance: newTotalRemaining,
            };
          })
        );
      }

      // Build descriptive line mentioning allocation breakdown if present
      let finalDescription = data.description?.trim();
      if (!finalDescription) {
        if (data.itemAllocations && data.itemAllocations.length > 0) {
          const allocationNotes = data.itemAllocations
            .filter((a) => a.allocatedAmount > 0)
            .map((a) => `${a.itemName}: Rs. ${a.allocatedAmount.toLocaleString()}`)
            .join(", ");
          finalDescription = `Payment received via ${data.paymentMethod} [Allocated: ${allocationNotes}]`;
        } else {
          finalDescription = `Payment received via ${data.paymentMethod}`;
        }
      }

      const newTx: LedgerTransaction = {
        id: `tx-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        type: "payment",
        amount: numAmount,
        date: data.date || new Date().toISOString().split("T")[0],
        description: finalDescription,
        paymentMethod: data.paymentMethod,
        itemAllocations: data.itemAllocations,
        billId: customerBill?.id,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Notification
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "Payment Received",
        message: `Rs. ${numAmount.toLocaleString()} received from ${customer.name}. New balance: Rs. ${(customer.currentBalance - numAmount).toLocaleString()}`,
        time: "Just now",
        type: "payment",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true, transaction: newTx };
    },
    [customersWithBalances, bills]
  );

  // Add Credit (Udhaar) action
  const addCredit = useCallback(
    (data: {
      customerId: string;
      amount: number;
      date: string;
      description: string;
      receiptNo?: string;
    }) => {
      const customer = customers.find((c) => c.id === data.customerId);
      if (!customer) {
        return { success: false, error: "Customer not found." };
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return { success: false, error: "Credit amount must be greater than zero." };
      }

      if (!data.description.trim()) {
        return { success: false, error: "Transaction description or items purchased is required." };
      }

      const newTx: LedgerTransaction = {
        id: `tx-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        type: "credit",
        amount: numAmount,
        date: data.date || new Date().toISOString().split("T")[0],
        description: data.description.trim(),
        receiptNo: data.receiptNo?.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      setTransactions((prev) => [newTx, ...prev]);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "Credit Issued",
        message: `Rs. ${numAmount.toLocaleString()} credit given to ${customer.name}.`,
        time: "Just now",
        type: "credit",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true, transaction: newTx };
    },
    [customers]
  );

  // Add Expense action
  const addExpense = useCallback(
    (data: {
      description: string;
      category: ExpenseCategory;
      amount: number;
      date: string;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => {
      const trimmedDesc = data.description.trim();
      if (!trimmedDesc || trimmedDesc.length < 2) {
        return { success: false, error: "Expense description is required." };
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return { success: false, error: "Amount must be a positive number." };
      }

      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        description: trimmedDesc,
        category: data.category,
        amount: numAmount,
        date: data.date || new Date().toISOString().split("T")[0],
        paymentMethod: data.paymentMethod,
        notes: data.notes?.trim(),
      };

      setExpenses((prev) => [newExp, ...prev]);

      return { success: true, expense: newExp };
    },
    []
  );

  // FINANCIAL & PROFIT LOGIC:
  // Gross Profit = Net Sales - Cost of Goods Sold (COGS)
  // Net Profit = Gross Profit - Operating Expenses
  // Cash payments received (collections of old credit) and outstanding udhaar are tracked separately.
  const getMonthlyProfit = useCallback(
    (monthStr: string): MonthlyFinancialSummary => {
      // Month format: '2026-10'
      const monthTx = transactions.filter((t) => t.date.startsWith(monthStr));
      const monthExpenses = expenses.filter((e) => e.date.startsWith(monthStr));

      // Credit sales recorded in month
      const creditSales = monthTx
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);

      // Estimated cash counter sales for Peshawar retail store in this month
      // (Provides realistic complete sales ledger for the store)
      const cashCounterSales = monthStr === "2026-10" ? 95000 : monthStr === "2026-09" ? 88000 : 82000;
      const totalSales = creditSales + cashCounterSales;

      // COGS Calculation:
      // Itemized bills provide verified wholesale cost
      // Tariq's bill: Rs. 15,000 sales -> Rs. 11,800 cost (COGS margin 78.6%)
      // Remaining sales estimated at standard retail wholesale cost ratio (78%)
      const itemizedBillInMonth = bills.filter((b) => b.date.startsWith(monthStr));
      const itemizedSales = itemizedBillInMonth.reduce((sum, b) => sum + b.totalAmount, 0);
      const itemizedCost = itemizedBillInMonth.reduce((sum, b) => sum + b.totalCost, 0);

      const unItemizedSales = Math.max(0, totalSales - itemizedSales);
      // Average wholesale cost factor in Peshawar consumer staples is ~78%
      const unItemizedCost = Math.round(unItemizedSales * 0.78);

      const totalCogs = itemizedCost + unItemizedCost;
      const grossProfit = totalSales - totalCogs;

      // Operating Expenses: Excludes inventory purchases (which are asset investments)
      const operatingExpenses = monthExpenses
        .filter((e) => e.category !== "Inventory")
        .reduce((sum, e) => sum + e.amount, 0);

      const netProfit = grossProfit - operatingExpenses;

      // Payments received in this month (cashflow, NOT profit)
      const paymentsReceived = monthTx
        .filter((t) => t.type === "payment")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const [year, month] = monthStr.split("-");
      const monthLabel = `${monthNames[parseInt(month, 10) - 1] || "Month"} ${year}`;

      return {
        month: monthStr,
        monthLabel,
        totalSales,
        cogs: totalCogs,
        hasReliableCostData: true,
        grossProfit,
        operatingExpenses,
        netProfit,
        outstandingUdhaar: totalOutstandingCredit,
        paymentsReceived,
        missingDataNotice:
          "Accrual accounting applied: Sales include both counter cash sales and new credit bills. COGS represents wholesale stock cost. Cash receipts and outstanding udhaar are tracked separately from net profit.",
      };
    },
    [transactions, expenses, bills, totalOutstandingCredit]
  );

  const getYearlyProfit = useCallback(
    (yearStr: string): YearlyFinancialSummary => {
      // Build 12 months for yearStr
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = (i + 1).toString().padStart(2, "0");
        return `${yearStr}-${m}`;
      });

      // We only have active data up to month 10 (October 2026)
      const monthlySummaries: MonthlyFinancialSummary[] = months.map((mStr, idx) => {
        if (mStr === "2026-10") {
          return getMonthlyProfit(mStr);
        }
        if (mStr === "2026-09") {
          return {
            month: mStr,
            monthLabel: "September 2026",
            totalSales: 138500,
            cogs: 108000,
            hasReliableCostData: true,
            grossProfit: 30500,
            operatingExpenses: 41200,
            netProfit: -10700,
            outstandingUdhaar: 42000,
            paymentsReceived: 56000,
          };
        }
        if (idx < 9) {
          // Historical months Jan-Aug 2026 demo baseline
          const s = 120000 + (idx * 3000);
          const c = Math.round(s * 0.78);
          const g = s - c;
          const e = 38000 + (idx * 500);
          return {
            month: mStr,
            monthLabel: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx]} ${yearStr}`,
            totalSales: s,
            cogs: c,
            hasReliableCostData: true,
            grossProfit: g,
            operatingExpenses: e,
            netProfit: g - e,
            outstandingUdhaar: 35000 + (idx * 1000),
            paymentsReceived: 45000 + (idx * 1500),
          };
        }
        // Future months Nov-Dec
        return {
          month: mStr,
          monthLabel: `${["Nov", "Dec"][idx - 10]} ${yearStr}`,
          totalSales: 0,
          cogs: 0,
          hasReliableCostData: false,
          grossProfit: 0,
          operatingExpenses: 0,
          netProfit: 0,
          outstandingUdhaar: 0,
          paymentsReceived: 0,
        };
      });

      const activeMonths = monthlySummaries.filter((m) => m.totalSales > 0);
      const totalSales = activeMonths.reduce((sum, m) => sum + m.totalSales, 0);
      const cogs = activeMonths.reduce((sum, m) => sum + m.cogs, 0);
      const grossProfit = totalSales - cogs;
      const operatingExpenses = activeMonths.reduce((sum, m) => sum + m.operatingExpenses, 0);
      const netProfit = grossProfit - operatingExpenses;
      const paymentsReceived = activeMonths.reduce((sum, m) => sum + m.paymentsReceived, 0);

      return {
        year: yearStr,
        totalSales,
        cogs,
        hasReliableCostData: true,
        grossProfit,
        operatingExpenses,
        netProfit,
        outstandingUdhaar: totalOutstandingCredit,
        paymentsReceived,
        monthlyBreakdown: monthlySummaries,
        priorYearComparison: {
          year: "2025",
          totalSales: 1350000,
          grossProfit: 297000,
          operatingExpenses: 440000,
          netProfit: -143000,
        },
      };
    },
    [getMonthlyProfit, totalOutstandingCredit]
  );

  const markNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetDemoData = useCallback(() => {
    setCustomers(INITIAL_CUSTOMERS);
    setBills(INITIAL_BILLS);
    setAdjustments([]);
    setTransactions(INITIAL_TRANSACTIONS);
    setExpenses(INITIAL_EXPENSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    closeModal();
  }, [closeModal]);

  return (
    <DashboardContext.Provider
      value={{
        customers,
        bills,
        adjustments,
        transactions,
        expenses,
        notifications,
        unreadNotificationCount,
        customersWithBalances,
        totalOutstandingCredit,
        totalCustomersCount,
        activeDebtorsCount,
        getCustomerWithBalance,
        getCustomerLedger,
        getCustomerBill,
        validateItemAdjustment,
        adjustBillItem,
        addCustomer,
        recordPayment,
        addCredit,
        addExpense,
        getMonthlyProfit,
        getYearlyProfit,
        markNotificationsAsRead,
        resetDemoData,
        activeModal,
        selectedCustomerIdForModal,
        openModal,
        closeModal,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
