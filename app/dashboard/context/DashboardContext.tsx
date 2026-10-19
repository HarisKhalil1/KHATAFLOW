"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";

export type TransactionType = "credit" | "payment" | "adjustment";
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

export interface StructuredPurchaseItemInput {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface ProductCatalogItem {
  id?: string;
  name: string;
  defaultUnit: string;
  defaultRate: number;
  category?: string;
}

export const STANDARD_PRODUCTS: ProductCatalogItem[] = [
  { id: "prod-rice-basmati", name: "Rice (Basmati)", defaultUnit: "kg", defaultRate: 200, category: "Grains" },
  { id: "prod-rice", name: "Rice", defaultUnit: "kg", defaultRate: 200, category: "Grains" },
  { id: "prod-dalda-oil", name: "Dalda oil", defaultUnit: "liters", defaultRate: 600, category: "Oils" },
  { id: "prod-cooking-oil", name: "Cooking Oil", defaultUnit: "liters", defaultRate: 600, category: "Oils" },
  { id: "prod-eggs", name: "Eggs", defaultUnit: "pieces", defaultRate: 30, category: "Dairy & Poultry" },
  { id: "prod-chocolate", name: "Chocolate", defaultUnit: "pieces", defaultRate: 50, category: "Confectionery" },
  { id: "prod-sugar", name: "Sugar", defaultUnit: "kg", defaultRate: 160, category: "Staples" },
  { id: "prod-wheat-flour", name: "Wheat Flour (Atta)", defaultUnit: "kg", defaultRate: 150, category: "Flour" },
  { id: "prod-tea", name: "Tea (Tapal Danedar)", defaultUnit: "kg", defaultRate: 1600, category: "Beverages" },
  { id: "prod-milk", name: "Milk", defaultUnit: "liters", defaultRate: 220, category: "Dairy" },
  { id: "prod-pulses", name: "Pulses (Daal Chana)", defaultUnit: "kg", defaultRate: 320, category: "Pulses" },
];

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
  customerCredit?: number; // Preserves overpayment credit when paidAmount > totalAmount
  notes?: string;
}

export interface ItemAdjustment {
  id: string;
  billId: string;
  billNo?: string;
  customerId: string;
  customerName?: string;
  originalItemId: string;
  originalItemName: string;
  enteredItemName: string;
  unit: string;
  originalQuantity: number;
  originalUnitPrice: number;
  originalLineTotal: number;
  correctedQuantity: number;
  correctedUnitPrice: number;
  correctedLineTotal: number;
  differenceAmount: number; // Positive = bill increased, Negative = bill reduced
  // Legacy compatibility fields
  quantityAdjusted: number;
  unitPrice: number;
  amountAdjusted: number;
  reason: string;
  date: string;
  timestamp?: string;
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
  customerCredit?: number; // Preserves customer overpayment credit when payments exceed purchases
  totalCredit: number;
  totalPaid: number;
  totalAdjusted?: number;
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
  getCustomerBills: (customerId: string) => CustomerBill[];
  getCustomerBill: (customerId: string, billId?: string) => CustomerBill | undefined;

  // Item-wise Validation & Actions
  validateItemAdjustment: (
    customerId: string,
    enteredItemName: string,
    quantity?: number,
    amount?: number,
    billId?: string
  ) => ValidationResult;

  adjustBillItem: (data: {
    customerId: string;
    billId?: string;
    itemId?: string;
    enteredItemName?: string;
    correctedQuantity?: number;
    correctedUnitPrice?: number;
    quantity?: number;
    unitPrice?: number;
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
    billId?: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    description?: string;
    itemAllocations?: PaymentItemAllocation[];
  }) => { success: boolean; error?: string; transaction?: LedgerTransaction };

  addCredit: (data: {
    customerId: string;
    amount?: number;
    date: string;
    description?: string;
    receiptNo?: string;
    items?: StructuredPurchaseItemInput[];
    notes?: string;
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

  // Product Catalog
  products: ProductCatalogItem[];
  addProduct: (product: { name: string; defaultUnit: string; defaultRate: number; category?: string }) => {
    success: boolean;
    product?: ProductCatalogItem;
    error?: string;
  };
  updateProductPrice: (productName: string, newRate: number, newUnit?: string) => {
    success: boolean;
    error?: string;
  };

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

// Verified initial store bills as authoritative source of truth for each customer
const INITIAL_BILLS: CustomerBill[] = [
  // Tariq Khan (cust-1) - Original Bill #BILL-1001 (Rs. 15,000)
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
  // Bilal Ahmed (cust-2)
  {
    id: "bill-1002",
    billNo: "REC-1049",
    customerId: "cust-2",
    customerName: "Bilal Ahmed (Peshawar Bakers)",
    date: "2026-10-04",
    totalAmount: 6200,
    totalCost: 4836,
    paidAmount: 3000,
    remainingBalance: 3200,
    notes: "Bakery stock: Dry milk powder & baking essentials.",
    items: [
      {
        id: "item-bilal-1",
        billId: "bill-1002",
        name: "Dry milk powder",
        quantity: 4,
        unit: "kg",
        unitPrice: 1000,
        unitCost: 780,
        lineTotal: 4000,
        paidAmount: 3000,
        remainingBalance: 1000,
      },
      {
        id: "item-bilal-2",
        billId: "bill-1002",
        name: "Baking flour & yeast",
        quantity: 11,
        unit: "packs",
        unitPrice: 200,
        unitCost: 156,
        lineTotal: 2200,
        paidAmount: 0,
        remainingBalance: 2200,
      },
    ],
  },
  // Haji Usman Shinwari (cust-3)
  {
    id: "bill-1003",
    billNo: "REC-1055",
    customerId: "cust-3",
    customerName: "Haji Usman Shinwari",
    date: "2026-10-05",
    totalAmount: 12000,
    totalCost: 9360,
    paidAmount: 6000,
    remainingBalance: 6000,
    notes: "Bulk Basmati Rice order.",
    items: [
      {
        id: "item-usman-1",
        billId: "bill-1003",
        name: "Basmati Rice (25kg bags)",
        quantity: 2,
        unit: "bags",
        unitPrice: 6000,
        unitCost: 4680,
        lineTotal: 12000,
        paidAmount: 6000,
        remainingBalance: 6000,
      },
    ],
  },
  // Rashid Mehmood (cust-4)
  {
    id: "bill-1004",
    billNo: "REC-1061",
    customerId: "cust-4",
    customerName: "Rashid Mehmood (City Pharmacy)",
    date: "2026-10-06",
    totalAmount: 3800,
    totalCost: 2964,
    paidAmount: 2000,
    remainingBalance: 1800,
    notes: "Mineral water cartons wholesale.",
    items: [
      {
        id: "item-rashid-1",
        billId: "bill-1004",
        name: "Mineral Water (Cartons)",
        quantity: 19,
        unit: "cartons",
        unitPrice: 200,
        unitCost: 156,
        lineTotal: 3800,
        paidAmount: 2000,
        remainingBalance: 1800,
      },
    ],
  },
  // Zubair Afridi (cust-5)
  {
    id: "bill-1005",
    billNo: "REC-1068",
    customerId: "cust-5",
    customerName: "Zubair Afridi (Gul Super Store)",
    date: "2026-10-07",
    totalAmount: 9000,
    totalCost: 7020,
    paidAmount: 9000,
    remainingBalance: 0,
    notes: "Cooking oil bulk carton.",
    items: [
      {
        id: "item-zubair-1",
        billId: "bill-1005",
        name: "Cooking Oil",
        quantity: 15,
        unit: "liters",
        unitPrice: 600,
        unitCost: 468,
        lineTotal: 9000,
        paidAmount: 9000,
        remainingBalance: 0,
      },
    ],
  },
  // Imran Shah (cust-6)
  {
    id: "bill-1006",
    billNo: "REC-1075",
    customerId: "cust-6",
    customerName: "Imran Shah",
    date: "2026-10-09",
    totalAmount: 4500,
    totalCost: 3510,
    paidAmount: 1150,
    remainingBalance: 3350,
    notes: "Pulses and wheat flour staple items.",
    items: [
      {
        id: "item-imran-1",
        billId: "bill-1006",
        name: "Pulses (Daal Chana)",
        quantity: 10,
        unit: "kg",
        unitPrice: 320,
        unitCost: 250,
        lineTotal: 3200,
        paidAmount: 1150,
        remainingBalance: 2050,
      },
      {
        id: "item-imran-2",
        billId: "bill-1006",
        name: "Wheat Flour (Atta)",
        quantity: 10,
        unit: "kg",
        unitPrice: 130,
        unitCost: 101,
        lineTotal: 1300,
        paidAmount: 0,
        remainingBalance: 1300,
      },
    ],
  },
];

// Initial Transactions linked with bills
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
    billId: "bill-1002",
  },
  {
    id: "tx-5",
    customerId: "cust-2",
    customerName: "Bilal Ahmed (Peshawar Bakers)",
    type: "payment",
    amount: 3000,
    date: "2026-10-11",
    description: "Bank transfer via Allied Bank [Allocated: Dry milk powder: Rs. 3,000]",
    paymentMethod: "Bank Transfer",
    billId: "bill-1002",
    itemAllocations: [{ itemId: "item-bilal-1", itemName: "Dry milk powder", allocatedAmount: 3000 }],
  },
  // Haji Usman Shinwari (Opening 20,000)
  {
    id: "tx-6",
    customerId: "cust-3",
    customerName: "Haji Usman Shinwari",
    type: "credit",
    amount: 12000,
    date: "2026-10-05",
    description: "Bulk Basmati Rice (2 bags 25kg)",
    receiptNo: "REC-1055",
    billId: "bill-1003",
  },
  {
    id: "tx-7",
    customerId: "cust-3",
    customerName: "Haji Usman Shinwari",
    type: "payment",
    amount: 6000,
    date: "2026-10-12",
    description: "Direct cash payment via driver [Allocated: Basmati Rice (25kg bags): Rs. 6,000]",
    paymentMethod: "Cash",
    billId: "bill-1003",
    itemAllocations: [{ itemId: "item-usman-1", itemName: "Basmati Rice (25kg bags)", allocatedAmount: 6000 }],
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
    billId: "bill-1004",
  },
  {
    id: "tx-9",
    customerId: "cust-4",
    customerName: "Rashid Mehmood (City Pharmacy)",
    type: "payment",
    amount: 2000,
    date: "2026-10-15",
    description: "JazzCash payment received [Allocated: Mineral Water (Cartons): Rs. 2,000]",
    paymentMethod: "JazzCash",
    billId: "bill-1004",
    itemAllocations: [{ itemId: "item-rashid-1", itemName: "Mineral Water (Cartons)", allocatedAmount: 2000 }],
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
    billId: "bill-1005",
  },
  {
    id: "tx-11",
    customerId: "cust-5",
    customerName: "Zubair Afridi (Gul Super Store)",
    type: "payment",
    amount: 9000,
    date: "2026-10-16",
    description: "Full clearance via EasyPaisa [Allocated: Cooking Oil: Rs. 9,000]",
    paymentMethod: "EasyPaisa",
    billId: "bill-1005",
    itemAllocations: [{ itemId: "item-zubair-1", itemName: "Cooking Oil", allocatedAmount: 9000 }],
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
    billId: "bill-1006",
  },
  {
    id: "tx-13",
    customerId: "cust-6",
    customerName: "Imran Shah",
    type: "payment",
    amount: 1150,
    date: "2026-10-17",
    description: "Cash payment at shop [Allocated: Pulses (Daal Chana): Rs. 1,150]",
    paymentMethod: "Cash",
    billId: "bill-1006",
    itemAllocations: [{ itemId: "item-imran-1", itemName: "Pulses (Daal Chana)", allocatedAmount: 1150 }],
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

const STORAGE_KEY = "KHATAFLOW_STORAGE_V3";

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => STANDARD_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [bills, setBills] = useState<CustomerBill[]>(INITIAL_BILLS);
  const [adjustments, setAdjustments] = useState<ItemAdjustment[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore persistent state from localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1) {
            if (Array.isArray(parsed.customers) && parsed.customers.length > 0) setCustomers(parsed.customers);
            if (Array.isArray(parsed.bills)) setBills(parsed.bills);
            if (Array.isArray(parsed.adjustments)) setAdjustments(parsed.adjustments);
            if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) setTransactions(parsed.transactions);
            if (Array.isArray(parsed.expenses) && parsed.expenses.length > 0) setExpenses(parsed.expenses);
            if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
            if (Array.isArray(parsed.products) && parsed.products.length > 0) setProducts(parsed.products);
          }
        }
      }
    } catch (err) {
      console.warn("Could not hydrate KhataFlow from storage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save persistent state whenever data changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (typeof window !== "undefined") {
        const payload = {
          version: 1,
          savedAt: new Date().toISOString(),
          customers,
          bills,
          adjustments,
          transactions,
          expenses,
          notifications,
          products,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("Could not save KhataFlow to storage:", err);
    }
  }, [isHydrated, customers, bills, adjustments, transactions, expenses, notifications, products]);

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
      let totalAdjusted = 0;
      let lastDate = c.createdAt;

      custTxs.forEach((t) => {
        if (t.type === "credit") {
          totalCredit += t.amount;
        } else if (t.type === "payment") {
          totalPaid += t.amount;
        } else if (t.type === "adjustment") {
          totalAdjusted += t.amount;
        }
        if (t.date > lastDate) {
          lastDate = t.date;
        }
      });

      const netOwed = c.openingBalance + totalCredit - totalPaid - totalAdjusted;
      const currentBalance = netOwed > 0 ? netOwed : 0;
      const customerCredit = netOwed < 0 ? Math.abs(netOwed) : 0;

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
        currentBalance,
        customerCredit,
        totalCredit,
        totalPaid,
        totalAdjusted,
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

  const getCustomerBills = useCallback(
    (customerId: string): CustomerBill[] => {
      return bills.filter((b) => b.customerId === customerId);
    },
    [bills]
  );

  const getCustomerBill = useCallback(
    (customerId: string, billId?: string): CustomerBill | undefined => {
      const custBills = bills.filter((b) => b.customerId === customerId);
      if (custBills.length === 0) return undefined;
      if (billId) {
        const found = custBills.find((b) => b.id === billId);
        if (found) return found;
      }
      if (custBills.length === 1) return custBills[0];

      // Consolidated bill representation for customer
      const allItems = custBills.flatMap((b) => b.items);
      const totalAmount = allItems.reduce((sum, it) => sum + it.lineTotal, 0);
      const paidAmount = allItems.reduce((sum, it) => sum + it.paidAmount, 0);
      return {
        id: custBills[0].id,
        billNo: custBills[0].billNo,
        customerId,
        customerName: custBills[0].customerName,
        date: custBills[custBills.length - 1].date,
        items: allItems,
        totalAmount,
        totalCost: custBills.reduce((sum, b) => sum + b.totalCost, 0),
        paidAmount,
        remainingBalance: Math.max(0, totalAmount - paidAmount),
        customerCredit: Math.max(0, paidAmount - totalAmount),
        notes: custBills.map((b) => b.notes).filter(Boolean).join("; "),
      };
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
  // Supports universal parity across all customers & bills.
  const validateItemAdjustment = useCallback(
    (
      customerId: string,
      enteredItemName: string,
      quantity?: number,
      unitPrice?: number,
      billId?: string
    ): ValidationResult => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) {
        return { isValid: false, errorMessage: "Customer not found." };
      }

      const custBills = bills.filter((b) => b.customerId === customerId);
      if (custBills.length === 0 || custBills.every((b) => b.items.length === 0)) {
        return {
          isValid: false,
          errorMessage: `No original itemized bill on file for ${customer.name}. Item-wise adjustments require an original bill.`,
        };
      }

      // If a specific billId is requested, search within that bill, else search across customer's bills
      const targetBills = billId ? custBills.filter((b) => b.id === billId) : custBills;
      const allCustomerItems = targetBills.flatMap((b) => b.items);

      const cleanEnteredName = enteredItemName.trim().toLowerCase();
      if (!cleanEnteredName) {
        return { isValid: false, errorMessage: "Please select or enter an item name from the customer's bill." };
      }

      const matched = allCustomerItems.find(
        (it) => it.name.trim().toLowerCase() === cleanEnteredName || it.id === enteredItemName
      );

      if (!matched) {
        const originalItemList = Array.from(new Set(allCustomerItems.map((i) => i.name))).join(", ");
        return {
          isValid: false,
          errorMessage: `This item does not match ${customer.name}'s original bill. The original bill contains ${originalItemList}, not ${enteredItemName.trim()}. Please review the original ledger.`,
          suggestedItems: allCustomerItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`),
        };
      }

      // Quantity validation if provided
      if (quantity !== undefined) {
        if (isNaN(quantity) || quantity <= 0) {
          return {
            isValid: false,
            errorMessage: "Corrected quantity must be greater than zero.",
            matchedItem: matched,
          };
        }
      }

      // Unit price validation if provided
      if (unitPrice !== undefined) {
        if (isNaN(unitPrice) || unitPrice <= 0) {
          return {
            isValid: false,
            errorMessage: "Unit price must be greater than zero.",
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
  // Universal: works consistently for ALL customers and bills
  const adjustBillItem = useCallback(
    (data: {
      customerId: string;
      billId?: string;
      itemId?: string;
      enteredItemName?: string;
      correctedQuantity?: number;
      correctedUnitPrice?: number;
      quantity?: number;
      unitPrice?: number;
      reason: string;
      date?: string;
    }) => {
      const customer = customers.find((c) => c.id === data.customerId);
      if (!customer) {
        return { success: false, error: "Customer not found." };
      }

      const custBills = bills.filter((b) => b.customerId === data.customerId);
      if (custBills.length === 0) {
        return { success: false, error: "Customer has no original bills on record." };
      }

      // Locate target bill & target item
      let targetBill: CustomerBill | undefined;
      let matchedItem: BillItem | undefined;

      if (data.billId && data.itemId) {
        targetBill = custBills.find((b) => b.id === data.billId);
        matchedItem = targetBill?.items.find((it) => it.id === data.itemId);
      }

      if (!matchedItem && data.itemId) {
        for (const b of custBills) {
          const item = b.items.find((it) => it.id === data.itemId);
          if (item) {
            targetBill = b;
            matchedItem = item;
            break;
          }
        }
      }

      if (!matchedItem && data.enteredItemName) {
        const cleanName = data.enteredItemName.trim().toLowerCase();
        for (const b of custBills) {
          const item = b.items.find((it) => it.name.trim().toLowerCase() === cleanName);
          if (item) {
            targetBill = b;
            matchedItem = item;
            break;
          }
        }
      }

      if (!targetBill || !matchedItem) {
        return {
          success: false,
          error: "Selected item could not be found on any original bill for this customer.",
        };
      }

      // Determine corrected quantity
      const newQty =
        data.correctedQuantity !== undefined
          ? Number(data.correctedQuantity)
          : data.quantity !== undefined
          ? Number(data.quantity)
          : matchedItem.quantity;

      if (isNaN(newQty) || newQty <= 0) {
        return { success: false, error: "Quantity must be greater than zero." };
      }

      // Determine corrected unit price
      const newPrice =
        data.correctedUnitPrice !== undefined
          ? Number(data.correctedUnitPrice)
          : data.unitPrice !== undefined
          ? Number(data.unitPrice)
          : matchedItem.unitPrice;

      if (isNaN(newPrice) || newPrice <= 0) {
        return { success: false, error: "Unit price must be greater than zero." };
      }

      if (!data.reason || !data.reason.trim()) {
        return { success: false, error: "Please enter a valid reason for this adjustment." };
      }

      // Original metrics
      const originalQuantity = matchedItem.quantity;
      const originalUnitPrice = matchedItem.unitPrice;
      const originalLineTotal = Math.round(originalQuantity * originalUnitPrice * 100) / 100;

      // Corrected metrics
      const correctedQuantity = newQty;
      const correctedUnitPrice = newPrice;
      const correctedLineTotal = Math.round(correctedQuantity * correctedUnitPrice * 100) / 100;

      // Difference in line total: positive means increase, negative means reduction
      const differenceAmount = Math.round((correctedLineTotal - originalLineTotal) * 100) / 100;

      const dateStr = data.date || new Date().toISOString().split("T")[0];

      // Create permanent audit adjustment record
      const newAdjustment: ItemAdjustment = {
        id: `adj-${Date.now()}`,
        billId: targetBill.id,
        billNo: targetBill.billNo,
        customerId: customer.id,
        customerName: customer.name,
        originalItemId: matchedItem.id,
        originalItemName: matchedItem.name,
        enteredItemName: (data.enteredItemName || matchedItem.name).trim(),
        unit: matchedItem.unit,
        originalQuantity,
        originalUnitPrice,
        originalLineTotal,
        correctedQuantity,
        correctedUnitPrice,
        correctedLineTotal,
        differenceAmount,
        quantityAdjusted: Math.abs(correctedQuantity - originalQuantity),
        unitPrice: correctedUnitPrice,
        amountAdjusted: Math.abs(differenceAmount),
        reason: data.reason.trim(),
        date: dateStr,
        timestamp: new Date().toISOString(),
      };

      // 1. Update bill and items with precision, preserving payments
      setBills((prevBills) =>
        prevBills.map((b) => {
          if (b.id !== targetBill!.id) return b;

          const updatedItems = b.items.map((it) => {
            if (it.id !== matchedItem!.id) return it;
            const newLineTotal = correctedLineTotal;
            const newRemaining = Math.max(0, newLineTotal - it.paidAmount);
            return {
              ...it,
              quantity: correctedQuantity,
              unitPrice: correctedUnitPrice,
              lineTotal: newLineTotal,
              remainingBalance: newRemaining,
            };
          });

          const newTotalAmount = updatedItems.reduce((sum, it) => sum + it.lineTotal, 0);
          const preservedPaid = b.paidAmount; // Genuine payments preserved
          const newRemainingBalance = Math.max(0, newTotalAmount - preservedPaid);
          const overpaymentCredit = Math.max(0, preservedPaid - newTotalAmount);

          return {
            ...b,
            items: updatedItems,
            totalAmount: newTotalAmount,
            paidAmount: preservedPaid,
            remainingBalance: newRemainingBalance,
            customerCredit: overpaymentCredit,
          };
        })
      );

      // 2. Record ledger transaction to keep ledger & running balance strictly reconciled
      if (differenceAmount !== 0) {
        if (differenceAmount < 0) {
          // Reduction in bill: ledger adjustment transaction
          const reductionTx: LedgerTransaction = {
            id: `tx-adj-${Date.now()}`,
            customerId: customer.id,
            customerName: customer.name,
            type: "adjustment",
            amount: Math.abs(differenceAmount),
            date: dateStr,
            description: `Item Adjustment on Bill #${targetBill.billNo}: ${matchedItem.name} corrected from ${originalQuantity} ${matchedItem.unit} @ Rs. ${originalUnitPrice.toLocaleString()} (Rs. ${originalLineTotal.toLocaleString()}) to ${correctedQuantity} ${matchedItem.unit} @ Rs. ${correctedUnitPrice.toLocaleString()} (Rs. ${correctedLineTotal.toLocaleString()}). Correction: -Rs. ${Math.abs(differenceAmount).toLocaleString()} (${data.reason.trim()})`,
            receiptNo: `ADJ-${targetBill.billNo}`,
            billId: targetBill.id,
          };
          setTransactions((prev) => [reductionTx, ...prev]);
        } else {
          // Upward correction in bill: credit transaction
          const upwardTx: LedgerTransaction = {
            id: `tx-adj-${Date.now()}`,
            customerId: customer.id,
            customerName: customer.name,
            type: "credit",
            amount: differenceAmount,
            date: dateStr,
            description: `Upward Correction on Bill #${targetBill.billNo}: ${matchedItem.name} corrected from ${originalQuantity} ${matchedItem.unit} @ Rs. ${originalUnitPrice.toLocaleString()} (Rs. ${originalLineTotal.toLocaleString()}) to ${correctedQuantity} ${matchedItem.unit} @ Rs. ${correctedUnitPrice.toLocaleString()} (Rs. ${correctedLineTotal.toLocaleString()}). Correction: +Rs. ${differenceAmount.toLocaleString()} (${data.reason.trim()})`,
            receiptNo: `ADJ-${targetBill.billNo}`,
            billId: targetBill.id,
          };
          setTransactions((prev) => [upwardTx, ...prev]);
        }
      }

      // 3. Save adjustment audit record
      setAdjustments((prev) => [newAdjustment, ...prev]);

      // 4. Notification
      const diffSign =
        differenceAmount < 0
          ? `-Rs. ${Math.abs(differenceAmount).toLocaleString()}`
          : `+Rs. ${differenceAmount.toLocaleString()}`;
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "Bill Item Adjusted",
        message: `${matchedItem.name} adjusted on ${customer.name}'s bill #${targetBill.billNo} (${diffSign}). New Bill Total: Rs. ${(targetBill.totalAmount + differenceAmount).toLocaleString()}.`,
        time: "Just now",
        type: "info",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return {
        success: true,
        adjustment: newAdjustment,
      };
    },
    [customers, bills]
  );

  // Product Catalog Actions
  const addProduct = useCallback(
    (data: { name: string; defaultUnit: string; defaultRate: number; category?: string }) => {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        return { success: false, error: "Product name is required." };
      }
      const rate = Number(data.defaultRate);
      if (isNaN(rate) || rate <= 0) {
        return { success: false, error: "Default product rate must be greater than zero." };
      }
      const unit = data.defaultUnit.trim() || "pieces";

      let createdOrUpdated: ProductCatalogItem;

      setProducts((prev) => {
        const existingIdx = prev.findIndex(
          (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existingIdx >= 0) {
          // Avoid unnecessary duplicates: update existing catalog entry
          const updated = [...prev];
          createdOrUpdated = {
            ...updated[existingIdx],
            defaultRate: rate,
            defaultUnit: unit,
            category: data.category || updated[existingIdx].category,
          };
          updated[existingIdx] = createdOrUpdated;
          return updated;
        } else {
          // Add brand new product
          createdOrUpdated = {
            id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: trimmedName,
            defaultUnit: unit,
            defaultRate: rate,
            category: data.category || "General",
          };
          return [...prev, createdOrUpdated];
        }
      });

      return { success: true, product: createdOrUpdated! };
    },
    []
  );

  const updateProductPrice = useCallback(
    (productName: string, newRate: number, newUnit?: string) => {
      const trimmed = productName.trim().toLowerCase();
      const rate = Number(newRate);
      if (isNaN(rate) || rate <= 0) {
        return { success: false, error: "New rate must be greater than zero." };
      }

      let found = false;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.name.toLowerCase() === trimmed) {
            found = true;
            return {
              ...p,
              defaultRate: rate,
              defaultUnit: newUnit ? newUnit.trim() : p.defaultUnit,
            };
          }
          return p;
        })
      );

      if (!found) {
        return { success: false, error: `Product "${productName}" not found in catalog.` };
      }

      return { success: true };
    },
    []
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
      billId?: string;
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

      // Locate customer's bills
      const custBills = bills.filter((b) => b.customerId === data.customerId);
      let targetBill: CustomerBill | undefined;

      if (data.billId) {
        targetBill = custBills.find((b) => b.id === data.billId);
      } else if (custBills.length === 1) {
        targetBill = custBills[0];
      } else if (data.itemAllocations && data.itemAllocations.length > 0) {
        for (const alloc of data.itemAllocations) {
          const found = custBills.find((b) => b.items.some((it) => it.id === alloc.itemId));
          if (found) {
            targetBill = found;
            break;
          }
        }
      }
      if (!targetBill && custBills.length > 0) {
        targetBill = custBills.find((b) => b.remainingBalance > 0) || custBills[0];
      }

      // Validate item allocations if provided
      if (data.itemAllocations && data.itemAllocations.length > 0) {
        const totalAllocated = data.itemAllocations.reduce(
          (sum, a) => sum + Number(a.allocatedAmount || 0),
          0
        );

        if (totalAllocated > numAmount) {
          return {
            success: false,
            error: `Total item allocation (Rs. ${totalAllocated.toLocaleString()}) cannot exceed the payment amount of Rs. ${numAmount.toLocaleString()}.`,
          };
        }

        const allCustItems = custBills.flatMap((b) => b.items);

        for (const alloc of data.itemAllocations) {
          if (alloc.allocatedAmount <= 0) continue;
          const targetItem = allCustItems.find((i) => i.id === alloc.itemId);
          if (!targetItem) {
            return {
              success: false,
              error: `Allocated item "${alloc.itemName}" does not exist on customer's bill.`,
            };
          }
          if (alloc.allocatedAmount > targetItem.remainingBalance) {
            return {
              success: false,
              error: `Allocation of Rs. ${alloc.allocatedAmount.toLocaleString()} to ${targetItem.name} exceeds its remaining unpaid balance of Rs. ${targetItem.remainingBalance.toLocaleString()}.`,
            };
          }
        }
      }

      // Update bill and items with precision
      setBills((prevBills) =>
        prevBills.map((b) => {
          if (targetBill && b.id !== targetBill.id) return b;
          if (!targetBill && b.customerId !== data.customerId) return b;

          // 1. Update items that received allocations
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

          // 2. Update bill-level payment and outstanding balance
          // Formula: Outstanding = Bill Total - Total Valid Payments!
          const newTotalPaid = b.paidAmount + numAmount;
          const newTotalRemaining = Math.max(0, b.totalAmount - newTotalPaid);
          const customerCredit = Math.max(0, newTotalPaid - b.totalAmount);

          return {
            ...b,
            items: updatedItems,
            paidAmount: newTotalPaid,
            remainingBalance: newTotalRemaining,
            customerCredit,
          };
        })
      );

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

      // Record transaction with EXACT entered amount
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
        billId: targetBill?.id,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Notification
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "Payment Received",
        message: `Rs. ${numAmount.toLocaleString()} received from ${customer.name}. New outstanding: Rs. ${(customer.currentBalance - numAmount).toLocaleString()}`,
        time: "Just now",
        type: "payment",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true, transaction: newTx };
    },
    [customersWithBalances, bills]
  );

  // Add Credit (Udhaar) action with structured items support
  const addCredit = useCallback(
    (data: {
      customerId: string;
      amount?: number;
      date: string;
      description?: string;
      receiptNo?: string;
      items?: StructuredPurchaseItemInput[];
      notes?: string;
    }) => {
      const customer = customers.find((c) => c.id === data.customerId);
      if (!customer) {
        return { success: false, error: "Customer not found." };
      }

      let creditAmount = 0;
      let descriptionText = data.description?.trim() || "";
      let targetBillId: string | undefined;

      // Handle structured items if provided
      if (data.items && data.items.length > 0) {
        // Validate each item
        for (const item of data.items) {
          if (!item.name || !item.name.trim()) {
            return { success: false, error: "Every item must have a valid name." };
          }
          if (isNaN(item.quantity) || item.quantity <= 0) {
            return {
              success: false,
              error: `Invalid quantity for item "${item.name}". Quantity must be greater than zero.`,
            };
          }
          if (isNaN(item.unitPrice) || item.unitPrice <= 0) {
            return {
              success: false,
              error: `Invalid rate per unit for item "${item.name}". Rate must be greater than zero.`,
            };
          }
        }

        creditAmount = data.items.reduce(
          (sum, it) => sum + Math.round(Number(it.quantity) * Number(it.unitPrice) * 100) / 100,
          0
        );

        if (creditAmount <= 0) {
          return { success: false, error: "Total credit amount must be greater than zero." };
        }

        const existingBill = bills.find((b) => b.customerId === data.customerId);
        const billId = existingBill ? existingBill.id : `bill-${Date.now()}`;
        targetBillId = billId;

        const createdBillItems: BillItem[] = data.items.map((it, idx) => {
          const qty = Number(it.quantity);
          const rate = Number(it.unitPrice);
          const lineTotal = Math.round(qty * rate * 100) / 100;
          return {
            id: `item-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            billId,
            name: it.name.trim(),
            quantity: qty,
            unit: it.unit?.trim() || "pieces",
            unitPrice: rate,
            unitCost: Math.round(rate * 0.78 * 100) / 100,
            lineTotal,
            paidAmount: 0,
            remainingBalance: lineTotal,
          };
        });

        // Register any new custom products to catalog so they are available for future transactions
        data.items.forEach((it) => {
          const cleanName = it.name.trim();
          if (cleanName) {
            setProducts((prev) => {
              const exists = prev.some((p) => p.name.toLowerCase() === cleanName.toLowerCase());
              if (!exists) {
                return [
                  ...prev,
                  {
                    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: cleanName,
                    defaultUnit: it.unit?.trim() || "pieces",
                    defaultRate: Number(it.unitPrice) || 0,
                    category: "General",
                  },
                ];
              }
              return prev;
            });
          }
        });

        if (existingBill) {
          setBills((prev) =>
            prev.map((b) => {
              if (b.id !== billId) return b;
              const updatedItems = [...b.items, ...createdBillItems];
              const newTotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
              const newPaid = updatedItems.reduce((sum, item) => sum + item.paidAmount, 0);
              return {
                ...b,
                items: updatedItems,
                totalAmount: newTotal,
                totalCost: b.totalCost + Math.round(creditAmount * 0.78),
                paidAmount: newPaid,
                remainingBalance: Math.max(0, newTotal - newPaid),
              };
            })
          );
        } else {
          const billNo = data.receiptNo?.trim() || `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
          const newBill: CustomerBill = {
            id: billId,
            billNo,
            customerId: customer.id,
            customerName: customer.name,
            date: data.date || new Date().toISOString().split("T")[0],
            items: createdBillItems,
            totalAmount: creditAmount,
            totalCost: Math.round(creditAmount * 0.78),
            paidAmount: 0,
            remainingBalance: creditAmount,
            notes: data.notes?.trim() || data.description?.trim(),
          };
          setBills((prev) => [newBill, ...prev]);
        }

        const itemsSummary = data.items
          .map((i) => `${i.name} (${i.quantity} ${i.unit} @ Rs. ${i.unitPrice.toLocaleString()}/${i.unit})`)
          .join(", ");

        if (data.notes && data.notes.trim()) {
          descriptionText = `${itemsSummary} — Note: ${data.notes.trim()}`;
        } else {
          descriptionText = itemsSummary;
        }
      } else {
        // Fallback for simple credit without individual item rows
        creditAmount = Number(data.amount);
        if (isNaN(creditAmount) || creditAmount <= 0) {
          return { success: false, error: "Credit amount must be greater than zero." };
        }
        if (!descriptionText) {
          return { success: false, error: "Transaction description or items purchased is required." };
        }
      }

      const newTx: LedgerTransaction = {
        id: `tx-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        type: "credit",
        amount: creditAmount,
        date: data.date || new Date().toISOString().split("T")[0],
        description: descriptionText,
        receiptNo: data.receiptNo?.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        billId: targetBillId,
      };

      setTransactions((prev) => [newTx, ...prev]);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: "Credit Issued",
        message: `Rs. ${creditAmount.toLocaleString()} credit given to ${customer.name}.`,
        time: "Just now",
        type: "credit",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true, transaction: newTx };
    },
    [customers, bills]
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
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    setProducts(STANDARD_PRODUCTS);
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
        products,
        addProduct,
        updateProductPrice,
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
        getCustomerBills,
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
