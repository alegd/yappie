/**
 * Data-fetching facade — single abstraction over the data-fetching library.
 *
 * Every consumer should use these hooks (via feature hooks) instead of
 * useSWR / useSWRMutation directly. If the underlying library changes
 * (e.g., to react-query), only this file needs to be updated.
 */

import type { KeyedMutator } from "swr";
import useSWR, { mutate as globalMutate } from "swr";
import useSWRMutation from "swr/mutation";
import { api } from "@/lib/api";

// ─── useQuery ───────────────────────────────────────────

export interface QueryResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: KeyedMutator<T>;
}

export const useQuery = <T>(key: string | null): QueryResult<T> => {
  const { data, error, isLoading, mutate } = useSWR<T>(key, (url: string) => api.get<T>(url));
  return { data, error, isLoading, mutate };
};

// ─── useMutation ────────────────────────────────────────

type MutationMethod = "POST" | "PUT" | "DELETE" | "PATCH";

interface MutationOptions<T> {
  method: MutationMethod;
  invalidateKeys?: string[];
  onSuccess?: (data: T) => void;
}

export function useMutation<T>(
  endpoint: string,
  { method, invalidateKeys, onSuccess }: MutationOptions<T>,
) {
  const { trigger, isMutating, error } = useSWRMutation<T, Error, string, unknown>(
    endpoint,
    async (url: string, { arg }: { arg: unknown }) => {
      switch (method) {
        case "POST":
          return api.post<T>(url, arg);
        case "PUT":
        case "PATCH":
          return api.patch<T>(url, arg);
        case "DELETE":
          return api.delete<T>(url);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    {
      onSuccess: async (response) => {
        await invalidateQuery(endpoint);

        if (invalidateKeys?.length) {
          await Promise.all(invalidateKeys.map((key) => invalidateQuery(key)));
        }

        onSuccess?.(response as T);
      },
    },
  );

  return {
    mutate: (data?: unknown) => trigger(data),
    isPending: isMutating,
    error,
  };
}

// ─── invalidateQuery ────────────────────────────────────

export const invalidateQuery = (key: string): Promise<unknown> => globalMutate(key);
