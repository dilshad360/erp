import React from "react";
import TablePageSkeleton from "@/components/shared/skeletons/TablePageSkeleton";

export default function EmployeesLoading(): React.JSX.Element {
  return <TablePageSkeleton hasAction={true} hasTabs={true} tabCount={2} rowCount={6} colCount={5} />;
}
