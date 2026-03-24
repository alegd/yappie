"use client";

import { PaginationState, SortingState } from "@tanstack/react-table";
import { useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

interface UseTableOptionsConfig {
  defaultSort?: SortingState;
  defaultPageSize?: number;
}

export function useTableOptions({
  defaultSort = [],
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: UseTableOptionsConfig = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const [sortBy, setSortBy] = useState<SortingState>(defaultSort);

  return {
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    onPaginationChange: setPagination,
    sortBy,
    setSortBy,
  };
}
