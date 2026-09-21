import React from "react";
import TablePageSkeleton from "@/components/shared/skeletons/TablePageSkeleton";

export default function ClientsLoading(): React.JSX.Element {
  return <TablePageSkeleton hasAction={true} hasTabs={false} rowCount={6} colCount={5} />;
}
