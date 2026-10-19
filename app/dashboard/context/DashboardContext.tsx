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

interface DashboardContextType {
  // Data
  customers: Customer[];
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

  markNotificationsAsRead: () => void;
  resetDemoData: () => void;

  // Active Modals Control
  activeModal: "payment" | "credit" | "customer" | "expense" | null;
  selectedCustomerIdForModal: string | null;
  openModal: (type: "payment" | "credit" | "customer" | "expense", customerId?: string) => void;
  closeModal: () => void;
}

// Initial realistic demo data for Peshawar Retail Store
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Tariq Khan (Khan Store)",
    phone: "0301-5551234",
    address: "Saddar Road, Shop #14, Peshawar",
    status: "active",
    openingBalance: 10000,
    createdAt: "2026-09-01",
    notes: "Wholesale buyer, settles every Friday.",
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

const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
  // Tariq Khan (Opening 10,000)
  {
    id: "tx-1",
    customerId: "cust-1",
    customerName: "Tariq Khan (Khan Store)",
    type: "credit",
    amount: 7500,
    date: "2026-10-02",
    description: "Purchase: 5 bags Dalda Ghee & 2 bags Sugar",
    receiptNo: "REC-1041",
  },
  {
    id: "tx-2",
    customerId: "cust-1",
    customerName: "Tariq Khan (Khan Store)",
    type: "payment",
    amount: 5000,
    date: "2026-10-08",
    description: "Partial cash payment at shop counter",
    paymentMethod: "Cash",
  },
  {
    id: "tx-3",
    customerId: "cust-1",
    customerName: "Tariq Khan (Khan Store)",
    type: "credit",
    amount: 2000,
    date: "2026-10-14",
    description: "Tea packets (Tapal Danedar 1kg x 2)",
    receiptNo: "REC-1088",
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
    notes: "Invoice #GM-8821 for staple grains",
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
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modal control
  const [activeModal, setActiveModal] = useState<"payment" | "credit" | "customer" | "expense" | null>(null);
  const [selectedCustomerIdForModal, setSelectedCustomerIdForModal] = useState<string | null>(null);

  const openModal = useCallback((type: "payment" | "credit" | "customer" | "expense", customerId?: string) => {
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
      
      // Update status dynamically if cleared
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

      // Pakistani phone validation (e.g. 03xx-xxxxxxx or 03xxxxxxxxx or +923xxxxxxxxx)
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

      // Add a notification
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

  // Record Payment action with strict balance validation
  const recordPayment = useCallback(
    (data: {
      customerId: string;
      amount: number;
      date: string;
      paymentMethod: PaymentMethod;
      description?: string;
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

      const newTx: LedgerTransaction = {
        id: `tx-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        type: "payment",
        amount: numAmount,
        date: data.date || new Date().toISOString().split("T")[0],
        description: data.description?.trim() || `Payment received via ${data.paymentMethod}`,
        paymentMethod: data.paymentMethod,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Add notification
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
    [customersWithBalances]
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

      // Add notification
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

  const markNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetDemoData = useCallback(() => {
    setCustomers(INITIAL_CUSTOMERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setExpenses(INITIAL_EXPENSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    closeModal();
  }, [closeModal]);

  return (
    <DashboardContext.Provider
      value={{
        customers,
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
        addCustomer,
        recordPayment,
        addCredit,
        addExpense,
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
