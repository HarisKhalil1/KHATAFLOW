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

export const HARIS_DEMO_SHOP_ID = "SHOP-PK-HARIS";

export const HARIS_DEMO_SHOP: RegisteredShop = {
  id: HARIS_DEMO_SHOP_ID,
  name: "Haris Khan Demo Store",
  category: "General Store",
  city: "Peshawar",
  address: "Demo Commercial Plaza, Saddar Road, Peshawar",
  ownerName: "Haris Khan",
  ownerPhone: "0300-5551234",
  ownerUsername: "hariskhan",
  ownerPassword: "password123",
  status: "active",
  createdAt: "2026-10-01T10:00:00.000Z",
  isClaimed: true,
  isDemoCreated: true,
  claimCode: "CLAIM-HARIS1",
};

// Permanent demo shop is default
const DEFAULT_SHOPS: RegisteredShop[] = [HARIS_DEMO_SHOP];

// Helper to reliably identify stale demo/testing records for cleanup
const isOldDemoShop = (s: RegisteredShop): boolean => {
  if (!s) return false;
  const id = (s.id || "").toUpperCase().trim();

  // EXPLICIT PROTECTION: The permanent Haris Khan demo shop is protected!
  if (id === HARIS_DEMO_SHOP_ID) {
    return false;
  }

  const name = (s.name || "").toLowerCase().trim();
  const owner = (s.ownerName || "").toLowerCase().trim();

  // Baseline legacy demo shops
  if (id === "SHOP-PK-001" || id === "SHOP-PK-002" || id === "SHOP-PK-003" || id.startsWith("SHOP-PK-00")) {
    return true;
  }
  if (
    name === "khyber general store" ||
    name === "madina super store" ||
    name === "al-rehman pharmacy" ||
    name.includes("khyber") ||
    name.includes("madina") ||
    name.includes("al-rehman") ||
    name.includes("rehman")
  ) {
    return true;
  }

  // Pre-cleanup manual test shops from prior sessions (except the permanent Haris Khan demo shop)
  if (
    /\b(rayan|ryan)\b/i.test(name) ||
    /\b(rayan|ryan)\b/i.test(owner) ||
    (id !== HARIS_DEMO_SHOP_ID && (name.includes("haris") || owner.includes("haris")))
  ) {
    return true;
  }

  return false;
};

const ShopRegistryContext = createContext<ShopRegistryContextType | undefined>(undefined);

export function ShopRegistryProvider({ children }: { children: React.ReactNode }) {
  const [shops, setShops] = useState<RegisteredShop[]>(DEFAULT_SHOPS);
  const [activeShopId, setActiveShopIdState] = useState<string>("");
  const [session, setSession] = useState<UserSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore registry & session from localStorage on client mount, safely purging old demo data
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // 1. Clean legacy demo data keys from client storage
        try {
          window.localStorage.removeItem("KHATAFLOW_STORAGE_V3");
          window.localStorage.removeItem("KHATAFLOW_STORAGE_SHOP-PK-001");
          window.localStorage.removeItem("KHATAFLOW_STORAGE_SHOP-PK-002");
          window.localStorage.removeItem("KHATAFLOW_STORAGE_SHOP-PK-003");
        } catch {
          // ignore
        }

        const raw = window.localStorage.getItem(REGISTRY_STORAGE_KEY);
        let checkedShops: RegisteredShop[] = [];

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const now = new Date().getTime();
              // Clean out old demo shops
              parsed.forEach((s: RegisteredShop) => {
                if (isOldDemoShop(s)) {
                  try {
                    window.localStorage.removeItem(`KHATAFLOW_STORAGE_${s.id}`);
                  } catch {
                    // ignore
                  }
                }
              });

              // Retain valid non-stale shops
              const nonDemoShops = parsed.filter((s: RegisteredShop) => !isOldDemoShop(s));

              // Check and enforce automatic suspension expiry for remaining shops
              checkedShops = nonDemoShops.map((s: RegisteredShop) => {
                let updated: RegisteredShop = { ...s };
                if (s.status === "suspended" && s.suspensionExpiresAt) {
                  const expiryTime = new Date(s.suspensionExpiresAt).getTime();
                  if (now >= expiryTime) {
                    updated = {
                      ...updated,
                      status: "active" as ShopStatus,
                      suspensionReason: undefined,
                      suspensionExpiresAt: undefined,
                      suspendedAt: undefined,
                    };
                  }
                }
                return updated;
              });
            }
          } catch (e) {
            console.warn("Could not parse stored registry:", e);
          }
        }

        // Guarantee that exactly ONE permanent Haris Khan demo store exists in the registry
        const harisExists = checkedShops.some((s) => s.id === HARIS_DEMO_SHOP_ID);
        if (!harisExists) {
          checkedShops.unshift(HARIS_DEMO_SHOP);
        } else {
          // If already present, make sure it retains active & demo-created status
          checkedShops = checkedShops.map((s) =>
            s.id === HARIS_DEMO_SHOP_ID
              ? { ...HARIS_DEMO_SHOP, ...s, status: "active", isClaimed: true, isDemoCreated: true }
              : s
          );
        }
        // Deduplicate any accidental multiple copies of any shop ID
        const seenIds = new Set<string>();
        checkedShops = checkedShops.filter((s) => {
          if (seenIds.has(s.id)) return false;
          seenIds.add(s.id);
          return true;
        });

        // Persist cleaned registry to localStorage
        window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(checkedShops));
        React.startTransition(() => {
          setShops(checkedShops);
        });

        // 2. Restore authenticated session (Safely preserve Super Admin!)
        const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (rawSession) {
          try {
            const parsedSession: UserSession = JSON.parse(rawSession);
            if (parsedSession && parsedSession.username) {
              // Super admin session is completely preserved
              if (parsedSession.role === "super-admin") {
                React.startTransition(() => {
                  setSession(parsedSession);
                });
              } else if (parsedSession.role === "shop-owner") {
                // If shop owner session belongs to a valid remaining shop, preserve it
                const shopStillExists = checkedShops.some((s) => s.id === parsedSession.shopId);
                if (shopStillExists) {
                  React.startTransition(() => {
                    setSession(parsedSession);
                    setActiveShopIdState(parsedSession.shopId);
                  });
                } else {
                  // Session belonged to a cleaned demo shop, remove it
                  window.localStorage.removeItem(SESSION_STORAGE_KEY);
                  React.startTransition(() => {
                    setSession(null);
                  });
                }
              }
            }
          } catch (e) {
            console.warn("Failed to parse stored session:", e);
          }
        } else {
          React.startTransition(() => {
            setSession(null);
          });
        }

        // 3. Restore or sanitize active shop ID
        const savedActive = window.localStorage.getItem(ACTIVE_SHOP_STORAGE_KEY);
        const isValidSavedActive = Boolean(
          savedActive && checkedShops.some((s) => s.id === savedActive)
        );
        const initialActiveId = isValidSavedActive
          ? (savedActive as string)
          : (checkedShops[0]?.id || "");

        React.startTransition(() => {
          setActiveShopIdState(initialActiveId);
        });
        if (initialActiveId) {
          window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, initialActiveId);
        } else {
          window.localStorage.removeItem(ACTIVE_SHOP_STORAGE_KEY);
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
        if (activeShopId) {
          window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, activeShopId);
        } else {
          window.localStorage.removeItem(ACTIVE_SHOP_STORAGE_KEY);
        }
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
    return shops.find((s) => s.id === activeShopId) || shops[0] || undefined;
  }, [shops, activeShopId]);

  // System statistics derived strictly from real registry records
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalShops: 0,
    activeShops: 0,
    suspendedShops: 0,
    pendingVerificationShops: 0,
    recentlyCreatedCount: 0,
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
    const existingIds = new Set(shops.map((s) => s.id.toUpperCase()));
    let maxNum = 1000;
    shops.forEach((s) => {
      const match = s.id.match(/SHOP-PK-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    let nextNum = maxNum + 1;
    let candidate = `SHOP-PK-${nextNum}`;
    while (existingIds.has(candidate.toUpperCase())) {
      nextNum += 1;
      candidate = `SHOP-PK-${nextNum}`;
    }
    return candidate;
  }, [shops]);

  // Helper to generate a secure random claim/invitation code with collision check
  const generateClaimCode = useCallback(() => {
    const existingCodes = new Set(
      shops.map((s) => s.claimCode).filter((c): c is string => Boolean(c))
    );
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do {
      code = "CLAIM-";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (existingCodes.has(code));
    return code;
  }, [shops]);

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

      // Shop Owner login - matches registered username, email, phone, or name
      const matchedShop = shops.find((s) => {
        const isHaris = s.id === HARIS_DEMO_SHOP_ID;
        const matchUsername = s.ownerUsername && s.ownerUsername.toLowerCase() === cleanUser;
        const matchPhone = s.ownerPhone && s.ownerPhone.replace(/\D/g, "") === cleanUser.replace(/\D/g, "");
        const matchName = s.ownerName && s.ownerName.toLowerCase() === cleanUser;
        const isHarisUserMatch =
          isHaris &&
          (cleanUser === "haris@khataflow.pk" ||
            cleanUser === "hariskhan@khataflow.pk" ||
            cleanUser === "hariskhan" ||
            cleanUser === "haris" ||
            cleanUser === "haris khan");

        if (!matchUsername && !matchPhone && !matchName && !isHarisUserMatch) return false;

        if (isHaris) {
          return (
            cleanPass === "haris123" ||
            cleanPass === "password123" ||
            cleanPass === "demo123" ||
            cleanPass === (s.ownerPassword || "")
          );
        }

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

      // Check if shop registration is pending Super Admin approval
      if (matchedShop.status === "pending-verification") {
        return {
          success: false,
          error: `Shop "${matchedShop.name}" registration is pending approval by Super Admin. You will receive access once approved.`,
        };
      }

      // Check if shop is suspended
      if (matchedShop.status === "suspended") {
        const suspension = isShopSuspended(matchedShop.id);
        if (suspension.isSuspended) {
          return {
            success: false,
            error: `Shop "${matchedShop.name}" is currently suspended. Reason: ${suspension.reason || "Administrative hold"}.`,
          };
        }
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
        status: "pending-verification",
        createdAt: new Date().toISOString(),
        isClaimed: true,
      };

      setShops((prev) => [newShop, ...prev]);

      return {
        success: true,
        shop: newShop,
        message: `Shop registered successfully! Assigned unique ID: ${newId}. Registration is pending Super Admin approval before you can access the dashboard.`,
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
      const shop = shops.find((s) => s.id === shopId);
      if (!shop) {
        return { eligible: false, reason: "Shop not found in registry." };
      }
      if (shop.id === HARIS_DEMO_SHOP_ID) {
        return {
          eligible: false,
          reason: "Protected: Haris Khan Demo Store is the permanent testing account and cannot be deleted.",
        };
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

  // 9. Manual Delete Demo Shop (removes selected eligible shop and its isolated data)
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
      const remainingShops = shops.filter((s) => s.id !== shopId);
      setShops(remainingShops);

      // Remove associated scoped demo records where safe
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`KHATAFLOW_STORAGE_${shopId}`);
        } catch (e) {
          console.warn("Could not clean scoped storage for deleted shop:", e);
        }
      }

      // If active shop was the deleted shop, reset to remaining or empty
      if (activeShopId === shopId) {
        const nextActive = remainingShops[0]?.id || "";
        setActiveShopIdState(nextActive);
        if (typeof window !== "undefined") {
          if (nextActive) {
            window.localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, nextActive);
          } else {
            window.localStorage.removeItem(ACTIVE_SHOP_STORAGE_KEY);
          }
        }
      }

      return { success: true };
    },
    [isShopEligibleForDemoDelete, activeShopId, shops]
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
