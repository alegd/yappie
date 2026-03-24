"use client";

import { cn } from "@/lib/utils";
import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZES = [10, 25, 50];

interface PaginationProps<T> {
  table: Table<T>;
  total: number;
}

export function Pagination<T>({ table, total }: Readonly<PaginationProps<T>>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  const btnClass =
    "p-1.5 rounded-lg border border-border transition hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="sm:flex justify-between items-center px-4 pb-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="bg-surface px-2 py-1 border border-border-hover focus:border-primary rounded-lg focus:outline-none text-sm"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {from}–{to} of {total}
        </span>
        <button
          className={cn(btnClass)}
          onClick={() => table.firstPage()}
          disabled={!canPrev}
          aria-label="First page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          className={cn(btnClass)}
          onClick={() => table.previousPage()}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className={cn(btnClass)}
          onClick={() => table.nextPage()}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className={cn(btnClass)}
          onClick={() => table.lastPage()}
          disabled={!canNext}
          aria-label="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
