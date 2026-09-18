import React from "react";
import TenantPreloader from "@/components/shared/TenantPreloader";

export default function AppLoading(): React.JSX.Element {
  return (
    <TenantPreloader
      message="Loading workspace…"
      fullScreen={false}
      className="py-24"
    />
  );
}
