"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { useShopRegistry, HARIS_DEMO_SHOP_ID } from "../../context/ShopRegistryContext";
import {
  HARIS_DEMO_CUSTOMERS,
  HARIS_DEMO_BILLS,
  HARIS_DEMO_TRANSACTIONS,
  HARIS_DEMO_EXPENSES,
  HARIS_DEMO_NOTIFICATIONS,
  HARIS_DEMO_PRODUCTS,
} from "./harisDemoData";

export type TransactionType = "credit" | "payment" | "adjustment";
export type ExpenseCategory = "Inventory" | "Rent" | "Utilities" | "Transport" | "Staff" | "Other";
export type PaymentMethod = "Cash" | "Bank Transfer" | "JazzCash" | "EasyPaisa";
export type CustomerStatus = "active" | "cleared" | "overdue" | "archived";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  openingBalance: number;
  createdAt: string;
  notes?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archiveReason?: string;
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

export const STANDARD_PRODUCTS: ProductCatalogItem[] = [];

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
  archivedCustomers: CustomerWithBalance[];
  allCustomersWithBalances: CustomerWithBalance[];
  totalOutstandingCredit: number;
  totalCustomersCount: number;
  activeDebtorsCount: number;
  getCustomerWithBalance: (id: string) => CustomerWithBalance | undefined;
  getCustomerLedger: (customerId: string) => LedgerEntryWithRunningBalance[];
  getCustomerBills: (customerId: string) => CustomerBill[];
  getCustomerBill: (customerId: string, billId?: string) => CustomerBill | undefined;
  getCustomerFinancialSummary: (customerId: string) => {
    billsCount: number;
    transactionsCount: number;
    adjustmentsCount: number;
    currentBalance: number;
    totalCredit: number;
    totalPaid: number;
    hasFinancialHistory: boolean;
  };

  // Safe Customer Lifecycle Actions
  archiveCustomer: (customerId: string, reason?: string) => { success: boolean; error?: string };
  restoreCustomer: (customerId: string) => { success: boolean; error?: string };
  deleteCustomer: (
    customerId: string,
    force?: boolean
  ) => {
    success: boolean;
    error?: string;
    mode?: "permanent_empty" | "permanent_forced";
    hasFinancialRecords?: boolean;
  };
  updateCustomer: (
    customerId: string,
    data: { name?: string; phone?: string; address?: string; notes?: string }
  ) => { success: boolean; error?: string; customer?: Customer };

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
  updateProduct: (
    originalName: string,
    data: { name: string; defaultUnit: string; defaultRate: number; category?: string }
  ) => { success: boolean; error?: string };
  deleteProduct: (productName: string) => { success: boolean };

  // Active Modals Control
  activeModal:
    | "payment"
    | "credit"
    | "customer"
    | "expense"
    | "item-adjust"
    | "delete-customer"
    | "edit-customer"
    | null;
  selectedCustomerIdForModal: string | null;
  openModal: (
    type:
      | "payment"
      | "credit"
      | "customer"
      | "expense"
      | "item-adjust"
      | "delete-customer"
      | "edit-customer",
    customerId?: string
  ) => void;
  closeModal: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const STORAGE_KEY = "KHATAFLOW_STORAGE_V3";

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { activeShopId } = useShopRegistry();
  const currentStorageKey = activeShopId ? `KHATAFLOW_STORAGE_${activeShopId}` : STORAGE_KEY;

  const [products, setProducts] = useState<ProductCatalogItem[]>(() => STANDARD_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<CustomerBill[]>([]);
  const [adjustments, setAdjustments] = useState<ItemAdjustment[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore persistent state from localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(currentStorageKey);
        let loaded = false;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1 && Array.isArray(parsed.customers) && parsed.customers.length > 0) {
            loaded = true;
            queueMicrotask(() => {
              if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
              if (Array.isArray(parsed.bills)) setBills(parsed.bills);
              if (Array.isArray(parsed.adjustments)) setAdjustments(parsed.adjustments);
              if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
              if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
              if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
              if (Array.isArray(parsed.products) && parsed.products.length > 0) setProducts(parsed.products);
            });
          }
        }
        if (!loaded) {
          if (activeShopId === HARIS_DEMO_SHOP_ID) {
            queueMicrotask(() => {
              setCustomers(HARIS_DEMO_CUSTOMERS);
              setBills(HARIS_DEMO_BILLS);
              setAdjustments([]);
              setTransactions(HARIS_DEMO_TRANSACTIONS);
              setExpenses(HARIS_DEMO_EXPENSES);
              setNotifications(HARIS_DEMO_NOTIFICATIONS);
              setProducts(HARIS_DEMO_PRODUCTS);
            });
          } else {
            queueMicrotask(() => {
              setCustomers([]);
              setBills([]);
              setAdjustments([]);
              setTransactions([]);
              setExpenses([]);
              setNotifications([]);
              setProducts(STANDARD_PRODUCTS);
            });
          }
        }
      }
    } catch (err) {
      console.warn("Could not hydrate KhataFlow from storage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, [currentStorageKey, activeShopId]);

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
        window.localStorage.setItem(currentStorageKey, JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("Could not save KhataFlow to storage:", err);
    }
  }, [isHydrated, currentStorageKey, activeShopId, customers, bills, adjustments, transactions, expenses, notifications, products]);

  // Modal control
  // Modal control
  const [activeModal, setActiveModal] = useState<
    | "payment"
    | "credit"
    | "customer"
    | "expense"
    | "item-adjust"
    | "delete-customer"
    | "edit-customer"
    | null
  >(null);
  const [selectedCustomerIdForModal, setSelectedCustomerIdForModal] = useState<string | null>(null);

  const openModal = useCallback(
    (
      type:
        | "payment"
        | "credit"
        | "customer"
        | "expense"
        | "item-adjust"
        | "delete-customer"
        | "edit-customer",
      customerId?: string
    ) => {
      setActiveModal(type);
      setSelectedCustomerIdForModal(customerId || null);
    },
    []
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedCustomerIdForModal(null);
  }, []);

  // Compute customer balances for ALL customers (both active & archived)
  const allCustomersWithBalances = useMemo<CustomerWithBalance[]>(() => {
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

      // Update status dynamically: "archived" takes precedence if soft-deleted
      let dynamicStatus: CustomerStatus = c.status;
      if (c.isArchived) {
        dynamicStatus = "archived";
      } else if (currentBalance === 0) {
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

  // Active customers with balances (excluding archived accounts)
  const customersWithBalances = useMemo<CustomerWithBalance[]>(() => {
    return allCustomersWithBalances.filter((c) => !c.isArchived);
  }, [allCustomersWithBalances]);

  // Archived customers with balances
  const archivedCustomers = useMemo<CustomerWithBalance[]>(() => {
    return allCustomersWithBalances.filter((c) => !!c.isArchived);
  }, [allCustomersWithBalances]);

  const totalOutstandingCredit = useMemo(() => {
    return customersWithBalances.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [customersWithBalances]);

  const totalCustomersCount = customersWithBalances.length;

  const activeDebtorsCount = useMemo(() => {
    return customersWithBalances.filter((c) => c.currentBalance > 0).length;
  }, [customersWithBalances]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Search across all customers (active & archived) so statements & ledgers remain accessible
  const getCustomerWithBalance = useCallback(
    (id: string) => {
      return allCustomersWithBalances.find((c) => c.id === id);
    },
    [allCustomersWithBalances]
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

  const updateProduct = useCallback(
    (
      originalName: string,
      data: { name: string; defaultUnit: string; defaultRate: number; category?: string }
    ) => {
      const orig = originalName.trim().toLowerCase();
      const newName = data.name.trim();
      if (!newName) {
        return { success: false, error: "Item name cannot be empty." };
      }
      const rate = Number(data.defaultRate);
      if (isNaN(rate) || rate <= 0) {
        return { success: false, error: "Default price must be greater than zero." };
      }
      const unit = data.defaultUnit.trim() || "pieces";

      let found = false;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.name.toLowerCase() === orig) {
            found = true;
            return {
              ...p,
              name: newName,
              defaultUnit: unit,
              defaultRate: rate,
              category: data.category || p.category,
            };
          }
          return p;
        })
      );

      if (!found) {
        return { success: false, error: `Item "${originalName}" not found.` };
      }
      return { success: true };
    },
    []
  );

  const deleteProduct = useCallback(
    (productName: string) => {
      const trimmed = productName.trim().toLowerCase();
      setProducts((prev) => prev.filter((p) => p.name.toLowerCase() !== trimmed));
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

      if (trimmedPhone) {
        const digitsOnly = trimmedPhone.replace(/\D/g, "");
        if (digitsOnly.length > 0 && digitsOnly.length < 5) {
          return {
            success: false,
            error: "Please enter a valid phone number (at least 5 digits) or leave blank.",
          };
        }
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

  // Get Customer Financial Summary (for safe deletion/archiving checks)
  const getCustomerFinancialSummary = useCallback(
    (customerId: string) => {
      const cust = allCustomersWithBalances.find((c) => c.id === customerId);
      const custBills = bills.filter((b) => b.customerId === customerId);
      const custTxs = transactions.filter((t) => t.customerId === customerId);
      const custAdjs = adjustments.filter((a) => a.customerId === customerId);

      const hasFinancialHistory =
        custBills.length > 0 ||
        custTxs.length > 0 ||
        custAdjs.length > 0 ||
        (cust?.openingBalance ? cust.openingBalance > 0 : false);

      return {
        billsCount: custBills.length,
        transactionsCount: custTxs.length,
        adjustmentsCount: custAdjs.length,
        currentBalance: cust?.currentBalance || 0,
        totalCredit: cust?.totalCredit || 0,
        totalPaid: cust?.totalPaid || 0,
        hasFinancialHistory,
      };
    },
    [allCustomersWithBalances, bills, transactions, adjustments]
  );

  // Safe Archive Customer (Soft-Delete)
  const archiveCustomer = useCallback(
    (customerId: string, reason?: string) => {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) {
        return { success: false, error: "Customer not found." };
      }

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                isArchived: true,
                archivedAt: new Date().toISOString(),
                archiveReason: reason?.trim() || "Archived by shopkeeper",
                status: "archived" as CustomerStatus,
              }
            : c
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: "Customer Archived",
          message: `${cust.name} was safely archived. All historical ledger records and bills are preserved.`,
          time: "Just now",
          type: "info",
          read: false,
        },
        ...prev,
      ]);

      return { success: true };
    },
    [customers]
  );

  // Restore Customer
  const restoreCustomer = useCallback(
    (customerId: string) => {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) {
        return { success: false, error: "Customer not found." };
      }

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                isArchived: false,
                archivedAt: undefined,
                archiveReason: undefined,
                status: "active" as CustomerStatus,
              }
            : c
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: "Customer Restored",
          message: `${cust.name} has been restored to active customers.`,
          time: "Just now",
          type: "info",
          read: false,
        },
        ...prev,
      ]);

      return { success: true };
    },
    [customers]
  );

  // Delete Customer (Permanent delete for empty customers, or forced delete with confirmation)
  const deleteCustomer = useCallback(
    (customerId: string, force?: boolean) => {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) {
        return { success: false, error: "Customer not found." };
      }

      const custBills = bills.filter((b) => b.customerId === customerId);
      const custTxs = transactions.filter((t) => t.customerId === customerId);
      const custAdjs = adjustments.filter((a) => a.customerId === customerId);
      const hasFinancialRecords =
        custBills.length > 0 ||
        custTxs.length > 0 ||
        custAdjs.length > 0 ||
        (cust.openingBalance && cust.openingBalance > 0);

      if (hasFinancialRecords && !force) {
        return {
          success: false,
          hasFinancialRecords: true,
          error:
            "This customer has financial records (bills, transactions, or balance). Use Archive Customer to preserve financial history.",
        };
      }

      // Remove customer from customers list
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));

      if (force && hasFinancialRecords) {
        // If permanent deletion was explicitly forced and confirmed with name verification,
        // clean up that customer's dependent records ONLY. Never touch other customers.
        setBills((prev) => prev.filter((b) => b.customerId !== customerId));
        setTransactions((prev) => prev.filter((t) => t.customerId !== customerId));
        setAdjustments((prev) => prev.filter((a) => a.customerId !== customerId));
      }

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: "Customer Deleted",
          message: `${cust.name} was permanently removed.`,
          time: "Just now",
          type: "alert" as const,
          read: false,
        },
        ...prev,
      ]);

      return {
        success: true,
        mode: (hasFinancialRecords ? "permanent_forced" : "permanent_empty") as
          | "permanent_empty"
          | "permanent_forced",
      };
    },
    [customers, bills, transactions, adjustments]
  );

  // Update Customer Details (Edit Customer)
  const updateCustomer = useCallback(
    (
      customerId: string,
      data: { name?: string; phone?: string; address?: string; notes?: string }
    ) => {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) {
        return { success: false, error: "Customer not found." };
      }

      if (data.name !== undefined) {
        const trimmedName = data.name.trim();
        if (!trimmedName || trimmedName.length < 2) {
          return { success: false, error: "Customer name must be at least 2 characters long." };
        }
      }

      if (data.phone !== undefined) {
        const trimmedPhone = data.phone.trim();
        if (trimmedPhone) {
          const digitsOnly = trimmedPhone.replace(/\D/g, "");
          if (digitsOnly.length > 0 && digitsOnly.length < 5) {
            return {
              success: false,
              error: "Please enter a valid phone number (at least 5 digits) or leave blank.",
            };
          }
        }
      }

      const updatedCust: Customer = {
        ...cust,
        name: data.name !== undefined ? data.name.trim() : cust.name,
        phone: data.phone !== undefined ? data.phone.trim() : cust.phone,
        address: data.address !== undefined ? data.address.trim() : cust.address,
        notes: data.notes !== undefined ? data.notes.trim() : cust.notes,
      };

      setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));

      // If name changed, update bill customerName headers
      if (data.name && data.name.trim() !== cust.name) {
        setBills((prev) =>
          prev.map((b) => (b.customerId === customerId ? { ...b, customerName: data.name!.trim() } : b))
        );
      }

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: "Customer Updated",
          message: `${updatedCust.name} details were updated successfully.`,
          time: "Just now",
          type: "info",
          read: false,
        },
        ...prev,
      ]);

      return { success: true, customer: updatedCust };
    },
    [customers]
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
      const allCust = allCustomersWithBalances.find((c) => c.id === data.customerId);
      if (!allCust) {
        return { success: false, error: "Customer not found." };
      }

      if (allCust.isArchived) {
        return {
          success: false,
          error: `Customer "${allCust.name}" is archived. Please restore the customer account before recording payments.`,
        };
      }

      const customer = allCust;

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

      // Determine effective item allocations: use explicit allocations if provided, otherwise auto-allocate FIFO
      let effectiveAllocations = data.itemAllocations;
      if (!effectiveAllocations || effectiveAllocations.length === 0) {
        let remainingToAllocate = numAmount;
        effectiveAllocations = [];
        const candidateBills = targetBill ? [targetBill] : custBills;
        for (const b of candidateBills) {
          for (const it of b.items) {
            if (it.remainingBalance > 0 && remainingToAllocate > 0) {
              const allocAmt = Math.min(it.remainingBalance, remainingToAllocate);
              effectiveAllocations.push({
                itemId: it.id,
                itemName: it.name,
                allocatedAmount: allocAmt,
              });
              remainingToAllocate -= allocAmt;
            }
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
            const matchedAlloc = effectiveAllocations?.find((a) => a.itemId === it.id);
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
        if (effectiveAllocations && effectiveAllocations.length > 0) {
          const allocationNotes = effectiveAllocations
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
        itemAllocations: effectiveAllocations,
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
    [allCustomersWithBalances, bills]
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

      if (customer.isArchived) {
        return {
          success: false,
          error: `Customer "${customer.name}" is archived. Please restore customer to record new credit.`,
        };
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

      const totalSales = creditSales;

      // COGS Calculation:
      // Itemized bills provide verified wholesale cost
      const itemizedBillInMonth = bills.filter((b) => b.date.startsWith(monthStr));
      const itemizedSales = itemizedBillInMonth.reduce((sum, b) => sum + b.totalAmount, 0);
      const itemizedCost = itemizedBillInMonth.reduce((sum, b) => sum + b.totalCost, 0);

      const unItemizedSales = Math.max(0, totalSales - itemizedSales);
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
        hasReliableCostData: bills.length > 0,
        grossProfit,
        operatingExpenses,
        netProfit,
        outstandingUdhaar: totalOutstandingCredit,
        paymentsReceived,
        missingDataNotice:
          "Accrual accounting applied: Sales reflect credit bills and transactions. Wholesale stock cost and cash collections are tracked accurately.",
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

      const monthlySummaries: MonthlyFinancialSummary[] = months.map((mStr) =>
        getMonthlyProfit(mStr)
      );

      const activeMonths = monthlySummaries.filter((m) => m.totalSales > 0 || m.operatingExpenses > 0);
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
          year: (parseInt(yearStr, 10) - 1).toString(),
          totalSales: 0,
          grossProfit: 0,
          operatingExpenses: 0,
          netProfit: 0,
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
      if (typeof window !== "undefined" && currentStorageKey) {
        window.localStorage.removeItem(currentStorageKey);
      }
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    if (activeShopId === HARIS_DEMO_SHOP_ID) {
      setProducts(HARIS_DEMO_PRODUCTS);
      setCustomers(HARIS_DEMO_CUSTOMERS);
      setBills(HARIS_DEMO_BILLS);
      setAdjustments([]);
      setTransactions(HARIS_DEMO_TRANSACTIONS);
      setExpenses(HARIS_DEMO_EXPENSES);
      setNotifications(HARIS_DEMO_NOTIFICATIONS);
    } else {
      setProducts([]);
      setCustomers([]);
      setBills([]);
      setAdjustments([]);
      setTransactions([]);
      setExpenses([]);
      setNotifications([]);
    }
    closeModal();
  }, [currentStorageKey, activeShopId, closeModal]);

  return (
    <DashboardContext.Provider
      value={{
        products,
        addProduct,
        updateProductPrice,
        updateProduct,
        deleteProduct,
        customers,
        bills,
        adjustments,
        transactions,
        expenses,
        notifications,
        unreadNotificationCount,
        customersWithBalances,
        archivedCustomers,
        allCustomersWithBalances,
        totalOutstandingCredit,
        totalCustomersCount,
        activeDebtorsCount,
        getCustomerWithBalance,
        getCustomerLedger,
        getCustomerBills,
        getCustomerBill,
        getCustomerFinancialSummary,
        archiveCustomer,
        restoreCustomer,
        deleteCustomer,
        updateCustomer,
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
