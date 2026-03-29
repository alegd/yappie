const API_BASE = "/api";

interface PublicFetcherOptions {
  method?: string;
  data?: unknown;
}

export async function publicFetcher<T>(
  endpoint: string,
  options: PublicFetcherOptions = {},
): Promise<T> {
  const { method = "POST", data } = options;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Request failed");
  }

  return json;
}
