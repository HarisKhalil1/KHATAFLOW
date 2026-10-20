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
  // Explicit persistent classification for safe demo shop deletion
  isDemoCreated?: boolean;
  // Registered credentials (stored securely for local environment)
  ownerUsername?: string;
  ownerPassword?: string;
}

export interface UserSession {
  username: string;
  role: "shop-owner" | "super-admin";
  shopId: string;
  shopName: string;
  authenticatedAt: string;
}

export interface RegisterShopInput {
  mode: "new" | "claim";
  name: string;
  category: ShopCategory;
  city: string;
  address?: string;
  ownerName: string;
  ownerPhone: string;
  username: string;
  password: string;
  confirmPassword: string;
  claimShopId?: string;
  claimCode?: string;
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
  session: UserSession | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  systemStats: SystemStats;
  setActiveShopId: (shopId: string) => void;
  login: (
    usernameOrEmail: string,
    password: string,
    role?: "shop-owner" | "super-admin"
  ) => { success: boolean; error?: string; session?: UserSession };
  logout: () => void;
  registerShopByOwner: (
    data: RegisterShopInput
  ) => { success: boolean; shop?: RegisteredShop; message: string; session?: UserSession };
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
  ensureShopClaimCode: (shopId: string) => string;
  isShopEligibleForDemoDelete: (shopId: string) => { eligible: boolean; reason?: string };
  deleteDemoShop: (shopId: string) => { success: boolean; error?: string };
}

const REGISTRY_STORAGE_KEY = "KHATAFLOW_SHOP_REGISTRY_V1";
const ACTIVE_SHOP_STORAGE_KEY = "KHATAFLOW_ACTIVE_SHOP_ID";
const SESSION_STORAGE_KEY = "KHATAFLOW_SESSION_V1";

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
    isDemoCreated: false,
    ownerUsername: "khyber@khataflow.pk",
    ownerPassword: "password123",
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
    isDemoCreated: false,
    ownerUsername: "madina@khataflow.pk",
    ownerPassword: "password123",
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
    isDemoCreated: false,
    ownerUsername: "rehman.pharmacy@khataflow.pk",
    ownerPassword: "password123",
  },
];

const ShopRegistryContext = createContext<ShopRegistryContextType | undefined>(undefined);

export function ShopRegistryProvider({ children }: { children: React.ReactNode }) {
  const [shops, setShops] = useState<RegisteredShop[]>(DEFAULT_SHOPS);
  const [activeShopId, setActiveShopIdState] = useState<string>("SHOP-PK-001");
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore registry & session from localStorage on client mount
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

        // Restore authenticated session
        const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (rawSession) {
          try {
            const parsedSession: UserSession = JSON.parse(rawSession);
            if (parsedSession && parsedSession.username) {
              React.startTransition(() => {
                setSession(parsedSession);
                if (parsedSession.role === "shop-owner" && parsedSession.shopId) {
                  setActiveShopIdState(parsedSession.shopId);
                }
              });
            }
          } catch (e) {
            console.warn("Failed to parse stored session:", e);
          }
        } else {
          React.startTransition(() => {
            setSession(null);
          });
        }

        const savedActive = window.localStorage.getItem(ACTIVE_SHOP_STORAGE_KEY);
        if (savedActive && !rawSession) {
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

  const setActiveShopId = useCallback(
    (shopId: string) => {
      // Tenant Isolation: An authenticated shop owner cannot switch to another shop's ID
      if (session && session.role === "shop-owner" && session.shopId !== shopId) {
        console.warn(
          `Tenant Isolation: Access denied for shop owner to switch to shop ID "${shopId}".`
        );
        return;
      }
      setActiveShopIdState(shopId);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, shopId);
        } catch (e) {
          console.warn("Error setting active shop ID:", e);
        }
      }
    },
    [session]
  );

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

  // 1. Owner Login
  const login = useCallback(
    (
      usernameOrEmail: string,
      password: string,
      role: "shop-owner" | "super-admin" = "shop-owner"
    ) => {
      const cleanUser = usernameOrEmail.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanUser || !cleanPass) {
        return { success: false, error: "Please enter your username/email and password." };
      }

      if (role === "super-admin") {
        const isAdminUser =
          cleanUser === "admin@khataflow.pk" ||
          cleanUser === "admin" ||
          cleanUser === "superadmin";
        const isAdminPass =
          cleanPass === "admin123" ||
          cleanPass === "adminpassword" ||
          cleanPass === "password123";

        if (isAdminUser && isAdminPass) {
          const adminSession: UserSession = {
            username: cleanUser,
            role: "super-admin",
            shopId: "SYSTEM",
            shopName: "Platform Governance",
            authenticatedAt: new Date().toISOString(),
          };
          setSession(adminSession);
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminSession));
            } catch (e) {
              console.warn("Storage error saving admin session:", e);
            }
          }
          return { success: true, session: adminSession };
        }
        return {
          success: false,
          error: "Invalid Super Admin credentials. Hint: admin@khataflow.pk / admin123",
        };
      }

      // Shop Owner login - matches registered username or phone
      const matchedShop = shops.find((s) => {
        const matchUsername = s.ownerUsername && s.ownerUsername.toLowerCase() === cleanUser;
        const matchPhone = s.ownerPhone && s.ownerPhone.replace(/\D/g, "") === cleanUser.replace(/\D/g, "");
        // Demo fallback: also allow "shopowner@khataflow.pk" for default shop SHOP-PK-001
        const isDemoKhyber = s.id === "SHOP-PK-001" && cleanUser === "shopowner@khataflow.pk";
        if (!matchUsername && !matchPhone && !isDemoKhyber) return false;

        const expectedPass = s.ownerPassword || "password123";
        return cleanPass === expectedPass;
      });

      if (!matchedShop) {
        return {
          success: false,
          error: "Invalid username/email or password. Please verify your credentials or register your shop.",
        };
      }

      // Check if shop has been claimed/activated
      if (matchedShop.isClaimed === false) {
        return {
          success: false,
          error: `Shop "${matchedShop.name}" (${matchedShop.id}) has not been claimed yet. Please select "Register Shop" and enter your admin claim code to activate your account.`,
        };
      }

      const ownerSession: UserSession = {
        username: matchedShop.ownerUsername || cleanUser,
        role: "shop-owner",
        shopId: matchedShop.id,
        shopName: matchedShop.name,
        authenticatedAt: new Date().toISOString(),
      };

      setSession(ownerSession);
      setActiveShopIdState(matchedShop.id);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ownerSession));
          window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, matchedShop.id);
        } catch (e) {
          console.warn("Storage error saving owner session:", e);
        }
      }

      return { success: true, session: ownerSession };
    },
    [shops]
  );

  // 2. Logout - clears session and token
  const logout = useCallback(() => {
    setSession(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {
        console.warn("Error removing session:", e);
      }
    }
  }, []);

  // 3. Owner Registration (either creating new shop or claiming existing admin-created shop)
  const registerShopByOwner = useCallback(
    (data: RegisterShopInput) => {
      const trimmedOwner = data.ownerName.trim();
      const trimmedPhone = data.ownerPhone.trim();
      const trimmedUsername = data.username.trim().toLowerCase();
      const trimmedPassword = data.password.trim();
      const trimmedConfirm = data.confirmPassword.trim();

      if (!trimmedOwner || !trimmedPhone || !trimmedUsername || !trimmedPassword || !trimmedConfirm) {
        return {
          success: false,
          message: "Please fill in all required owner fields: Name, Phone, Username/Email, and Password.",
        };
      }

      if (trimmedPassword !== trimmedConfirm) {
        return {
          success: false,
          message: "Passwords do not match. Please enter identical passwords.",
        };
      }

      if (trimmedPassword.length < 6) {
        return {
          success: false,
          message: "Password must be at least 6 characters long.",
        };
      }

      // Check duplicate username across registered shops
      const duplicateUser = shops.find(
        (s) => s.ownerUsername && s.ownerUsername.toLowerCase() === trimmedUsername
      );
      if (duplicateUser) {
        return {
          success: false,
          message: `Username or email "${data.username}" is already registered. Please sign in with your credentials.`,
        };
      }

      // Branch 1: Claiming an existing Super Admin-created shop
      if (data.mode === "claim") {
        const claimId = data.claimShopId?.trim().toUpperCase();
        const code = data.claimCode?.trim().toUpperCase();

        if (!claimId || !code) {
          return {
            success: false,
            message: "Both Shop ID and Admin Claim Code are required to claim an existing shop.",
          };
        }

        const targetShop = shops.find((s) => s.id.toUpperCase() === claimId);
        if (!targetShop) {
          return {
            success: false,
            message: `Shop ID "${data.claimShopId}" not found in system registry. Please verify with Super Admin.`,
          };
        }

        if (targetShop.isClaimed) {
          return {
            success: false,
            message: `Shop "${targetShop.name}" (${targetShop.id}) has already been claimed and activated. Please sign in with your registered credentials.`,
          };
        }

        if (!targetShop.claimCode || targetShop.claimCode.toUpperCase() !== code) {
          return {
            success: false,
            message: `Invalid claim code for shop "${targetShop.name}". Public Shop ID alone is not proof of ownership.`,
          };
        }

        // Valid claim: bind credentials and activate shop
        const updatedShop: RegisteredShop = {
          ...targetShop,
          name: data.name?.trim() || targetShop.name,
          ownerName: trimmedOwner,
          ownerPhone: trimmedPhone,
          ownerUsername: trimmedUsername,
          ownerPassword: trimmedPassword,
          status: "active",
          isClaimed: true,
          claimCode: undefined, // single-use consumed!
        };

        setShops((prev) => prev.map((s) => (s.id === targetShop.id ? updatedShop : s)));
        setActiveShopIdState(targetShop.id);

        const newSession: UserSession = {
          username: trimmedUsername,
          role: "shop-owner",
          shopId: targetShop.id,
          shopName: updatedShop.name,
          authenticatedAt: new Date().toISOString(),
        };
        setSession(newSession);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
            window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, targetShop.id);
          } catch (e) {
            console.warn("Storage error:", e);
          }
        }

        return {
          success: true,
          shop: updatedShop,
          session: newSession,
          message: `Claim verified! Shop "${updatedShop.name}" (${updatedShop.id}) has been activated under your account.`,
        };
      }

      // Branch 2: Creating a brand new self-registered shop
      const trimmedName = data.name.trim();
      const trimmedCity = data.city.trim() || "Peshawar";

      if (!trimmedName) {
        return {
          success: false,
          message: "Shop Name is required for new shop registration.",
        };
      }

      const newId = generateUniqueShopId();
      const newShop: RegisteredShop = {
        id: newId,
        name: trimmedName,
        category: data.category || "General Store",
        city: trimmedCity,
        address: data.address?.trim() || `${trimmedCity}, Pakistan`,
        ownerName: trimmedOwner,
        ownerPhone: trimmedPhone,
        ownerUsername: trimmedUsername,
        ownerPassword: trimmedPassword,
        status: "active",
        createdAt: new Date().toISOString(),
        isClaimed: true,
      };

      setShops((prev) => [newShop, ...prev]);
      setActiveShopIdState(newId);

      const newSession: UserSession = {
        username: trimmedUsername,
        role: "shop-owner",
        shopId: newId,
        shopName: newShop.name,
        authenticatedAt: new Date().toISOString(),
      };
      setSession(newSession);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
          window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, newId);
        } catch (e) {
          console.warn("Storage error:", e);
        }
      }

      return {
        success: true,
        shop: newShop,
        session: newSession,
        message: `Shop registered successfully! Assigned unique ID: ${newId}. Welcome to KhataFlow.`,
      };
    },
    [shops, generateUniqueShopId]
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
        isDemoCreated: true,
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

  // 7. Ensure Claim Code exists for a shop (never regenerates existing code, persists to localStorage)
  const ensureShopClaimCode = useCallback(
    (shopId: string) => {
      const shop = shops.find((s) => s.id === shopId);
      if (!shop) return "";
      if (shop.claimCode) {
        return shop.claimCode;
      }
      const newCode = generateClaimCode();
      const updatedShop: RegisteredShop = { ...shop, claimCode: newCode };
      setShops((prev) => prev.map((s) => (s.id === shopId ? updatedShop : s)));
      return newCode;
    },
    [shops, generateClaimCode]
  );

  // 8. Eligibility checker for manual demo shop deletion
  const isShopEligibleForDemoDelete = useCallback(
    (shopId: string) => {
      if (shopId === "SHOP-PK-001" || shopId === "SHOP-PK-002" || shopId === "SHOP-PK-003") {
        return {
          eligible: false,
          reason: "Protected: Baseline system shop cannot be deleted.",
        };
      }
      const shop = shops.find((s) => s.id === shopId);
      if (!shop) {
        return { eligible: false, reason: "Shop not found in registry." };
      }
      if (shop.isClaimed) {
        return {
          eligible: false,
          reason: "Protected: Claimed shop with active ownership cannot be deleted through demo controls.",
        };
      }
      if (!shop.isDemoCreated) {
        return {
          eligible: false,
          reason: "Protected: Only demo shops created via Super Admin test flow can be deleted.",
        };
      }
      return { eligible: true };
    },
    [shops]
  );

  // 9. Manual Delete Demo Shop (preserves original shops, customer records, and ledger history)
  const deleteDemoShop = useCallback(
    (shopId: string) => {
      const eligibility = isShopEligibleForDemoDelete(shopId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || "Shop is not eligible for deletion.",
        };
      }

      // Remove shop from registry
      setShops((prev) => prev.filter((s) => s.id !== shopId));

      // Remove associated scoped demo records where safe
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`KHATAFLOW_STORAGE_${shopId}`);
        } catch (e) {
          console.warn("Could not clean scoped storage for deleted shop:", e);
        }
      }

      // If active shop was the deleted shop, reset to default shop
      if (activeShopId === shopId) {
        setActiveShopIdState("SHOP-PK-001");
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, "SHOP-PK-001");
        }
      }

      return { success: true };
    },
    [isShopEligibleForDemoDelete, activeShopId]
  );

  const value = useMemo(
    () => ({
      shops,
      activeShopId,
      activeShop,
      session,
      isAuthenticated: session !== null,
      isHydrated,
      systemStats,
      setActiveShopId,
      login,
      logout,
      registerShopByOwner,
      createShopByAdmin,
      updateShopByAdmin,
      suspendShop,
      restoreShop,
      verifyShopByAdmin,
      isShopSuspended,
      ensureShopClaimCode,
      isShopEligibleForDemoDelete,
      deleteDemoShop,
    }),
    [
      shops,
      activeShopId,
      activeShop,
      session,
      isHydrated,
      systemStats,
      setActiveShopId,
      login,
      logout,
      registerShopByOwner,
      createShopByAdmin,
      updateShopByAdmin,
      suspendShop,
      restoreShop,
      verifyShopByAdmin,
      isShopSuspended,
      ensureShopClaimCode,
      isShopEligibleForDemoDelete,
      deleteDemoShop,
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
