import React from "react";
import TenantPreloader from "@/components/shared/TenantPreloader";

export default function TenantRootLoading(): React.JSX.Element {
  return (
    <TenantPreloader
      message="Loading company workspace…"
      fullScreen={true}
    />
  );
}
