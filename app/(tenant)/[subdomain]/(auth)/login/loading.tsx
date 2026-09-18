import React from "react";
import TenantPreloader from "@/components/shared/TenantPreloader";

export default function LoginLoading(): React.JSX.Element {
  return (
    <TenantPreloader
      message="Verifying session…"
      fullScreen={true}
    />
  );
}
