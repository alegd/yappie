"use client";

import { AppSelect } from "@/components/ui/app-select";
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
        <AppSelect
          value={String(pageSize)}
          onChange={(val) => table.setPageSize(Number(val))}
          options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
          ariaLabel="Rows per page"
          className="min-w-[70px]"
        />
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
