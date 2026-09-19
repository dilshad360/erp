import React from "react";
import GlobalPreloader from "@/components/shared/GlobalPreloader";

export default function MarketingLoading(): React.JSX.Element {
  return (
    <GlobalPreloader
      message="Loading…"
      fullScreen={true}
    />
  );
}
