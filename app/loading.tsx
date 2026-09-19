import React from "react";
import GlobalPreloader from "@/components/shared/GlobalPreloader";

export default function RootLoading(): React.JSX.Element {
  return (
    <GlobalPreloader
      message="Loading ERP SaaS…"
      fullScreen={true}
    />
  );
}
