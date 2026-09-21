"use client";

import React from "react";
import TenantPreloader from "./TenantPreloader";

export type GlobalPreloaderProps = {
  message?: string;
  fullScreen?: boolean;
  className?: string;
};

export default function GlobalPreloader({
  message = "Loading Octyvo…",
  fullScreen = true,
  className = "",
}: GlobalPreloaderProps): React.JSX.Element {
  return (
    <TenantPreloader
      companyName="Octyvo"
      brandColor="#6366f1"
      logoUrl="/logo.png"
      showAppLogoFallback={true}
      message={message}
      fullScreen={fullScreen}
      className={className}
    />
  );
}
