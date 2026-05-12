import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: true,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
