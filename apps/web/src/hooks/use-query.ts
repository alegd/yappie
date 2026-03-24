/**
 * Data-fetching facade — single abstraction over the data-fetching library.
 *
 * Every consumer should use these hooks (via feature hooks) instead of
 * useSWR / useSWRMutation directly. If the underlying library changes
 * (e.g., to react-query), only this file needs to be updated.
 */

import { apiFetcher } from "@/lib/api-fetcher";
import type { Key, KeyedMutator, SWRConfiguration } from "swr";
import useSWR, { mutate as globalMutate } from "swr";
import useSWRMutation from "swr/mutation";

// ─── useQuery ───────────────────────────────────────────

export interface QueryResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: KeyedMutator<T>;
}

export const useQuery = <T>(key: Key | null, options?: SWRConfiguration): QueryResult<T> => {
  const { data, error, isLoading, mutate } = useSWR<T>(key, options);
  return { data, error, isLoading, mutate };
};

// ─── useMutation ────────────────────────────────────────

type MutationMethod = "POST" | "PUT" | "DELETE" | "PATCH";

type MutationOptions<T> = {
  queryKey: string;
  method: MutationMethod;
  invalidateKeys?: string[];
  onSuccess?: (data: T) => void;
  headers?: object;
};

export function useMutation<T>({
  queryKey,
  method,
  invalidateKeys,
  headers,
  onSuccess,
}: MutationOptions<T>) {
  const keyString = typeof queryKey === "string" ? queryKey : queryKey[0];

  const { trigger, isMutating, error } = useSWRMutation<T, Error, string, unknown>(
    keyString,
    async (_url, { arg }) => {
      const res = await apiFetcher(queryKey, {
        method,
        data: arg,
        ...(headers ? { headers } : undefined),
      });

      if (!res || res.success === false || res.error) {
        throw res.error;
      }

      return res;
    },
    {
      onSuccess: async (response) => {
        await invalidateQuery(keyString);

        if (invalidateKeys?.length) {
          await Promise.all(invalidateKeys.map((key) => invalidateQuery(key)));
        }

        onSuccess?.(response as T);
      },
      onError: (err) => {
        throw err;
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
