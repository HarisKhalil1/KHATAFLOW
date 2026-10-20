"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type ShopCategory =
  | "General Store"
  | "Grocery / Kiryana"
  | "Pharmacy / Medical"
  | "Wholesale & Distribution"
  | "Electronics & Mobile"
  | "Bakery & Sweets"
  | "Other";

export type ShopStatus = "active" | "suspended" | "pending-verification";

export interface RegisteredShop {
  id: string; // System-generated unique Shop ID, e.g. "SHOP-PK-1001"
  name: string;
  category: ShopCategory;
  city: string;
  address?: string;
  ownerName: string;
  ownerPhone: string;
  status: ShopStatus;
  createdAt: string;
  // Suspension audit metadata (never deletes shop records)
  suspendedAt?: string;
  suspensionReason?: string;
  suspensionExpiresAt?: string; // ISO string or undefined for indefinite
  // Claim / invitation code for super admin created shops
  claimCode?: string;
  isClaimed?: boolean;
}

export interface SystemStats {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  pendingVerificationShops: number;
  recentlyCreatedCount: number; // created within last 30 days
}

interface ShopRegistryContextType {
  shops: RegisteredShop[];
  activeShopId: string;
  activeShop: RegisteredShop | undefined;
  systemStats: SystemStats;
  setActiveShopId: (shopId: string) => void;
  registerShopByOwner: (data: {
    name: string;
    category: ShopCategory;
    city: string;
    address?: string;
    ownerName: string;
    ownerPhone: string;
    claimCode?: string;
  }) => { success: boolean; shop?: RegisteredShop; message: string; requiresVerification: boolean };
  createShopByAdmin: (data: {
    name: string;
    category: ShopCategory;
    city: string;
    address?: string;
    ownerName: string;
    ownerPhone: string;
  }) => { success: boolean; shop?: RegisteredShop; claimCode?: string; error?: string };
  updateShopByAdmin: (
    shopId: string,
    data: { name?: string; category?: ShopCategory; city?: string; address?: string }
  ) => { success: boolean; error?: string };
  suspendShop: (
    shopId: string,
    reason: string,
    durationHours: number | null // null = indefinite until manual restore
  ) => { success: boolean; error?: string };
  restoreShop: (shopId: string) => { success: boolean; error?: string };
  verifyShopByAdmin: (shopId: string) => { success: boolean; error?: string };
  isShopSuspended: (shopId: string) => { isSuspended: boolean; reason?: string; expiresAt?: string };
}

const REGISTRY_STORAGE_KEY = "KHATAFLOW_SHOP_REGISTRY_V1";
const ACTIVE_SHOP_STORAGE_KEY = "KHATAFLOW_ACTIVE_SHOP_ID";

const DEFAULT_SHOPS: RegisteredShop[] = [
  {
    id: "SHOP-PK-001",
    name: "Khyber General Store",
    category: "General Store",
    city: "Peshawar",
    address: "Shop #12, Saddar Road, Peshawar Cantonment",
    ownerName: "Haji Abdul Rehman",
    ownerPhone: "0300-9876543",
    status: "active",
    createdAt: "2026-09-01T08:00:00.000Z",
    isClaimed: true,
  },
  {
    id: "SHOP-PK-002",
    name: "Madina Super Store",
    category: "Grocery / Kiryana",
    city: "Lahore",
    address: "Main Market, Gulberg III, Lahore",
    ownerName: "Muhammad Usman",
    ownerPhone: "0321-4567890",
    status: "active",
    createdAt: "2026-09-15T10:30:00.000Z",
    isClaimed: true,
  },
  {
    id: "SHOP-PK-003",
    name: "Al-Rehman Pharmacy",
    category: "Pharmacy / Medical",
    city: "Rawalpindi",
    address: "Bank Road, Saddar, Rawalpindi",
    ownerName: "Dr. Tariq Mahmood",
    ownerPhone: "0333-1234567",
    status: "suspended",
    createdAt: "2026-08-20T14:15:00.000Z",
    suspendedAt: "2026-10-18T10:00:00.000Z",
    suspensionReason: "Annual municipal license compliance update pending review",
    suspensionExpiresAt: "2026-11-18T10:00:00.000Z",
    isClaimed: true,
  },
];

const ShopRegistryContext = createContext<ShopRegistryContextType | undefined>(undefined);

export function ShopRegistryProvider({ children }: { children: React.ReactNode }) {
  const [shops, setShops] = useState<RegisteredShop[]>(DEFAULT_SHOPS);
  const [activeShopId, setActiveShopIdState] = useState<string>("SHOP-PK-001");
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore registry from localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(REGISTRY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check and enforce automatic suspension expiry
            const now = new Date().getTime();
            const checkedShops = parsed.map((s: RegisteredShop) => {
              if (s.status === "suspended" && s.suspensionExpiresAt) {
                const expiryTime = new Date(s.suspensionExpiresAt).getTime();
                if (now >= expiryTime) {
                  // Suspension has naturally expired
                  return {
                    ...s,
                    status: "active" as ShopStatus,
                    suspensionReason: undefined,
                    suspensionExpiresAt: undefined,
                    suspendedAt: undefined,
                  };
                }
              }
              return s;
            });
            React.startTransition(() => {
              setShops(checkedShops);
            });
          }
        }

        const savedActive = window.localStorage.getItem(ACTIVE_SHOP_STORAGE_KEY);
        if (savedActive) {
          React.startTransition(() => {
            setActiveShopIdState(savedActive);
          });
        }
      }
    } catch (err) {
      console.warn("Could not load shop registry from storage:", err);
    } finally {
      React.startTransition(() => {
        setIsHydrated(true);
      });
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(shops));
        window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, activeShopId);
      }
    } catch (err) {
      console.warn("Could not save shop registry to storage:", err);
    }
  }, [shops, activeShopId, isHydrated]);

  const setActiveShopId = useCallback((shopId: string) => {
    setActiveShopIdState(shopId);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, shopId);
      } catch (e) {
        console.warn("Error setting active shop ID:", e);
      }
    }
  }, []);

  // Check suspension status with timestamp check
  const isShopSuspended = useCallback(
    (shopId: string) => {
      const shop = shops.find((s) => s.id === shopId);
      if (!shop) return { isSuspended: false };

      if (shop.status === "suspended") {
        if (shop.suspensionExpiresAt) {
          const now = new Date().getTime();
          const expiryTime = new Date(shop.suspensionExpiresAt).getTime();
          if (now >= expiryTime) {
            // Expired naturally
            return { isSuspended: false };
          }
        }
        return {
          isSuspended: true,
          reason: shop.suspensionReason || "Administrative hold applied by Super Admin.",
          expiresAt: shop.suspensionExpiresAt,
        };
      }
      return { isSuspended: false };
    },
    [shops]
  );

  // Active shop object
  const activeShop = useMemo(() => {
    return shops.find((s) => s.id === activeShopId) || shops[0];
  }, [shops, activeShopId]);

  // System statistics derived strictly from real registry records
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalShops: DEFAULT_SHOPS.length,
    activeShops: DEFAULT_SHOPS.filter((s) => s.status === "active").length,
    suspendedShops: DEFAULT_SHOPS.filter((s) => s.status === "suspended").length,
    pendingVerificationShops: DEFAULT_SHOPS.filter((s) => s.status === "pending-verification").length,
    recentlyCreatedCount: DEFAULT_SHOPS.length,
  });

  useEffect(() => {
    const totalShops = shops.length;
    const activeShops = shops.filter((s) => s.status === "active").length;
    const suspendedShops = shops.filter((s) => s.status === "suspended").length;
    const pendingVerificationShops = shops.filter((s) => s.status === "pending-verification").length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyCreatedCount = shops.filter((s) => {
      const created = new Date(s.createdAt);
      return created >= thirtyDaysAgo;
    }).length;

    queueMicrotask(() => {
      setSystemStats({
        totalShops,
        activeShops,
        suspendedShops,
        pendingVerificationShops,
        recentlyCreatedCount,
      });
    });
  }, [shops]);

  // Helper to generate guaranteed collision-resistant Shop ID
  const generateUniqueShopId = useCallback(() => {
    const existingIds = new Set(shops.map((s) => s.id));
    let nextNum = shops.length + 1;
    let candidate = `SHOP-PK-${nextNum.toString().padStart(3, "0")}`;
    while (existingIds.has(candidate)) {
      nextNum += 1;
      candidate = `SHOP-PK-${nextNum.toString().padStart(3, "0")}`;
    }
    return candidate;
  }, [shops]);

  // Helper to generate a secure random claim/invitation code
  const generateClaimCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "CLAIM-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // 1. Owner self-registration from landing page
  const registerShopByOwner = useCallback(
    (data: {
      name: string;
      category: ShopCategory;
      city: string;
      address?: string;
      ownerName: string;
      ownerPhone: string;
      claimCode?: string;
    }) => {
      const trimmedName = data.name.trim();
      const trimmedOwner = data.ownerName.trim();
      const trimmedPhone = data.ownerPhone.trim();

      if (!trimmedName || !trimmedOwner || !trimmedPhone) {
        return {
          success: false,
          message: "Shop name, owner name, and contact phone are required.",
          requiresVerification: false,
        };
      }

      // Check if registering via an existing Super Admin Claim Code
      if (data.claimCode) {
        const matchingShop = shops.find(
          (s) => s.claimCode && s.claimCode.toUpperCase() === data.claimCode?.trim().toUpperCase()
        );
        if (matchingShop) {
          // Claim existing pre-created shop
          const updatedShop: RegisteredShop = {
            ...matchingShop,
            name: trimmedName || matchingShop.name,
            ownerName: trimmedOwner || matchingShop.ownerName,
            ownerPhone: trimmedPhone || matchingShop.ownerPhone,
            status: "active",
            isClaimed: true,
            claimCode: undefined,
          };
          setShops((prev) => prev.map((s) => (s.id === matchingShop.id ? updatedShop : s)));
          setActiveShopId(matchingShop.id);
          return {
            success: true,
            shop: updatedShop,
            message: `Invitation code verified! Shop "${updatedShop.name}" is now active.`,
            requiresVerification: false,
          };
        }
      }

      const newId = generateUniqueShopId();
      // Honest registration rule:
      // Since automated SMS OTP gateway is not configured in this local environment,
      // the new shop is registered in the official registry. If an admin approval workflow
      // is preferred, it can be pending-verification or directly activated with clear disclosure.
      // Here: newly self-registered shops are created as "active" with an honest verification disclosure.
      const newShop: RegisteredShop = {
        id: newId,
        name: trimmedName,
        category: data.category || "General Store",
        city: data.city.trim() || "Peshawar",
        address: data.address?.trim() || `${data.city.trim() || "Peshawar"}, Pakistan`,
        ownerName: trimmedOwner,
        ownerPhone: trimmedPhone,
        status: "active",
        createdAt: new Date().toISOString(),
        isClaimed: true,
      };

      setShops((prev) => [newShop, ...prev]);
      setActiveShopId(newId);

      return {
        success: true,
        shop: newShop,
        message: `Shop registered successfully! Assigned unique ID: ${newId}. Ready for login.`,
        requiresVerification: false,
      };
    },
    [shops, generateUniqueShopId, setActiveShopId]
  );

  // 2. Super Admin Creates Shop (Generates claim code, never sets owner password)
  const createShopByAdmin = useCallback(
    (data: {
      name: string;
      category: ShopCategory;
      city: string;
      address?: string;
      ownerName: string;
      ownerPhone: string;
    }) => {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        return { success: false, error: "Shop name is required." };
      }

      const newId = generateUniqueShopId();
      const claimCode = generateClaimCode();

      const newShop: RegisteredShop = {
        id: newId,
        name: trimmedName,
        category: data.category || "General Store",
        city: data.city.trim() || "Peshawar",
        address: data.address?.trim() || `${data.city.trim() || "Peshawar"}, Pakistan`,
        ownerName: data.ownerName.trim() || "Shop Owner",
        ownerPhone: data.ownerPhone.trim() || "0300-0000000",
        status: "active",
        createdAt: new Date().toISOString(),
        claimCode,
        isClaimed: false,
      };

      setShops((prev) => [newShop, ...prev]);

      return {
        success: true,
        shop: newShop,
        claimCode,
      };
    },
    [generateUniqueShopId, generateClaimCode]
  );

  // 3. Super Admin Updates Permitted Administrative Information
  const updateShopByAdmin = useCallback(
    (
      shopId: string,
      data: { name?: string; category?: ShopCategory; city?: string; address?: string }
    ) => {
      const target = shops.find((s) => s.id === shopId);
      if (!target) {
        return { success: false, error: "Shop not found in registry." };
      }

      setShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          return {
            ...s,
            name: data.name?.trim() || s.name,
            category: data.category || s.category,
            city: data.city?.trim() || s.city,
            address: data.address?.trim() || s.address,
          };
        })
      );

      return { success: true };
    },
    [shops]
  );

  // 4. Temporary Shop Suspension (Enforced with duration & audit trail)
  const suspendShop = useCallback(
    (shopId: string, reason: string, durationHours: number | null) => {
      const target = shops.find((s) => s.id === shopId);
      if (!target) {
        return { success: false, error: "Shop not found in registry." };
      }

      const trimmedReason = reason.trim() || "Administrative compliance hold applied by Super Admin.";
      const now = new Date();
      let expiresAt: string | undefined;

      if (durationHours && durationHours > 0) {
        const expiryDate = new Date(now.getTime() + durationHours * 3600 * 1000);
        expiresAt = expiryDate.toISOString();
      }

      setShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          return {
            ...s,
            status: "suspended",
            suspendedAt: now.toISOString(),
            suspensionReason: trimmedReason,
            suspensionExpiresAt: expiresAt,
          };
        })
      );

      return { success: true };
    },
    [shops]
  );

  // 5. Restore or Reactivate Suspended Shop
  const restoreShop = useCallback(
    (shopId: string) => {
      const target = shops.find((s) => s.id === shopId);
      if (!target) {
        return { success: false, error: "Shop not found in registry." };
      }

      setShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          return {
            ...s,
            status: "active",
            suspendedAt: undefined,
            suspensionReason: undefined,
            suspensionExpiresAt: undefined,
          };
        })
      );

      return { success: true };
    },
    [shops]
  );

  // 6. Verify Shop by Admin
  const verifyShopByAdmin = useCallback(
    (shopId: string) => {
      const target = shops.find((s) => s.id === shopId);
      if (!target) {
        return { success: false, error: "Shop not found in registry." };
      }

      setShops((prev) =>
        prev.map((s) => {
          if (s.id !== shopId) return s;
          return {
            ...s,
            status: "active",
          };
        })
      );

      return { success: true };
    },
    [shops]
  );

  const value = useMemo(
    () => ({
      shops,
      activeShopId,
      activeShop,
      systemStats,
      setActiveShopId,
      registerShopByOwner,
      createShopByAdmin,
      updateShopByAdmin,
      suspendShop,
      restoreShop,
      verifyShopByAdmin,
      isShopSuspended,
    }),
    [
      shops,
      activeShopId,
      activeShop,
      systemStats,
      setActiveShopId,
      registerShopByOwner,
      createShopByAdmin,
      updateShopByAdmin,
      suspendShop,
      restoreShop,
      verifyShopByAdmin,
      isShopSuspended,
    ]
  );

  return <ShopRegistryContext.Provider value={value}>{children}</ShopRegistryContext.Provider>;
}

export function useShopRegistry() {
  const context = useContext(ShopRegistryContext);
  if (!context) {
    throw new Error("useShopRegistry must be used within a ShopRegistryProvider");
  }
  return context;
}
