"use client";

import { createContext, useContext, useEffect } from "react";
import { applyBrandToDocument } from "@/lib/branding";

export type TenantContextValue = {
  companyId: string;
  companySlug: string;
  companyName: string;
  brandColor: string;
  logoUrl: string | null;
  userRole: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return ctx;
}

export function useOptionalTenant(): TenantContextValue | null {
  return useContext(TenantContext);
}

type TenantProviderProps = {
  tenant: TenantContextValue;
  children: React.ReactNode;
};

export default function TenantProvider({
  tenant,
  children,
}: TenantProviderProps): React.JSX.Element {
  useEffect(() => {
    if (tenant?.brandColor) {
      applyBrandToDocument(tenant.brandColor);
    }
  }, [tenant?.brandColor]);

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}
