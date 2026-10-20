"use client";

import React from "react";
import { ShopRegistryProvider } from "../context/ShopRegistryContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <ShopRegistryProvider>{children}</ShopRegistryProvider>;
}
