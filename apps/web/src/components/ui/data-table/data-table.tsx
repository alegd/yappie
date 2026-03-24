"use client";

import { cn } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { Pagination } from "./pagination";

const DEFAULT_PAGE_SIZE = 10;

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  count: number;
  loading?: boolean;
  page: number;
  pageSize: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  onRowClick?: (row: Row<T>) => void;
  sortBy?: SortingState;
  setSortBy?: OnChangeFn<SortingState>;
  toolbar?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  count,
  loading,
  page,
  pageSize,
  onPaginationChange,
  onRowClick,
  sortBy,
  setSortBy,
  toolbar,
}: Readonly<DataTableProps<T>>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange,
    onSortingChange: setSortBy,
    manualPagination: true,
    manualSorting: true,
    rowCount: count,
    state: {
      sorting: sortBy,
      pagination: { pageIndex: page, pageSize },
    },
  });

  const renderSkeletonRows = () =>
    Array.from({ length: pageSize || DEFAULT_PAGE_SIZE }).map((_, i) => (
      <tr key={i} className="border-border border-b h-14">
        {columns.map((_, j) => (
          <td key={j} className="px-4 py-3">
            <div className="bg-surface-hover rounded w-24 h-5 animate-pulse" />
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="space-y-4">
      {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-border border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-medium text-foreground/50 text-xs text-left uppercase tracking-wider"
                  >
                    {header.column.columnDef.header ? (
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() ? "cursor-pointer select-none" : "",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span>
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUpNarrowWide className="size-3.5" />
                            ) : (
                              <ArrowDownWideNarrow className="size-3.5" />
                            )}
                          </span>
                        )}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading
              ? renderSkeletonRows()
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-border border-b transition",
                      onRowClick ? "cursor-pointer hover:bg-surface/50" : "",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-muted-foreground text-center"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && <Pagination table={table} total={count} />}
    </div>
  );
}
