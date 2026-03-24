import { apiFetcher } from "@/lib/api-fetcher";
import { showError } from "@/lib/error";
import { ReactNode } from "react";
import { Cache, Fetcher, SWRConfig } from "swr";
import { PublicConfiguration } from "swr/_internal";

type Provider = { provider?: (cache: Readonly<Cache>) => Cache };

export function SwrConfig({
  children,
  swrConfig,
}: Readonly<{
  children?: ReactNode;
  swrConfig?: Partial<PublicConfiguration<unknown, unknown, Fetcher<unknown>>> & Provider;
}>) {
  return (
    <SWRConfig
      value={{
        fetcher: async (url: string, args: unknown = {}) => {
          const response = await apiFetcher(url, args);
          if (response.success === false) {
            showError(response.error);
            throw new Error(response.error);
          }
          return response;
        },
        use: [
          /* toCamelCase */
        ],
        ...swrConfig,
      }}
    >
      {children}
    </SWRConfig>
  );
}
