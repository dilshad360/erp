"use client";

import { createContext, useContext } from "react";

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

type TenantProviderProps = {
  tenant: TenantContextValue;
  children: React.ReactNode;
};

export default function TenantProvider({
  tenant,
  children,
}: TenantProviderProps): React.JSX.Element {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}
