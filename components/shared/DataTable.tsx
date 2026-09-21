"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import SkeletonTable from "./SkeletonTable";
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isFetching?: boolean;
  emptyState?: React.ReactNode;
  searchPlaceholder?: string;
  mobileCardRender?: (row: TData) => React.ReactNode;
  filterComponent?: React.ReactNode;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  isFetching = false,
  emptyState,
  searchPlaceholder = "Search...",
  mobileCardRender,
  filterComponent,
}: DataTableProps<TData, TValue>): React.JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return <SkeletonTable rows={5} cols={columns.length} />;
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="w-full space-y-4">
      {/* Controls: Search & Custom Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand)] animate-spin" />
          )}
        </div>

        {filterComponent && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {filterComponent}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <table className="w-full text-left text-sm text-[var(--color-text-primary)] border-collapse">
          <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="px-5 py-3.5 select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div
                        className={`flex items-center gap-1.5 ${
                          canSort ? "cursor-pointer hover:text-[var(--color-text-primary)]" : ""
                        }`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <span className="text-[var(--color-text-muted)]">
                            {isSorted === "asc" ? (
                              <ChevronUp size={14} className="text-[var(--color-brand)]" />
                            ) : isSorted === "desc" ? (
                              <ChevronDown size={14} className="text-[var(--color-brand)]" />
                            ) : (
                              <ChevronsUpDown size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[var(--color-surface-raised)]/60 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[var(--color-text-muted)]"
                >
                  {emptyState ?? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                        No results found
                      </p>
                      <p className="text-xs">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3 shadow-xs"
            >
              {mobileCardRender ? (
                mobileCardRender(row.original)
              ) : (
                <div className="space-y-2">
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border-subtle)] last:border-0"
                    >
                      <span className="font-medium text-[var(--color-text-secondary)]">
                        {typeof cell.column.columnDef.header === "string"
                          ? cell.column.columnDef.header
                          : cell.column.id}
                      </span>
                      <span>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {emptyState ?? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  No results found
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Try adjusting your search or filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)] pt-2 px-1">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] text-xs"
          >
            {[10, 25, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span className="ml-2">
            Showing {table.getRowModel().rows.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-raised)] transition-colors"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-raised)] transition-colors"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
