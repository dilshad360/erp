"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import TenantPreloader from "./TenantPreloader";

export type GlobalLoadingContextValue = {
  isLoading: boolean;
  message: string | null;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(null);

export function useGlobalLoading(): GlobalLoadingContextValue {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  }
  return ctx;
}

type GlobalLoadingProviderProps = {
  children: React.ReactNode;
};

export default function GlobalLoadingProvider({
  children,
}: GlobalLoadingProviderProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg ?? "Loading…");
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setMessage(null);
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, msg?: string): Promise<T> => {
      startLoading(msg);
      try {
        const result = await promise;
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const value = useMemo(
    () => ({
      isLoading,
      message,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [isLoading, message, startLoading, stopLoading, withLoading]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <TenantPreloader
          message={message || "Loading…"}
          fullScreen={true}
        />
      )}
    </GlobalLoadingContext.Provider>
  );
}
