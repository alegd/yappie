import { ApiError } from "../api-error";
import { env } from "../env";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../secure-store";

const BASE_URL = `${env.apiUrl}/api/v1`;

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data = (await res.json()) as RefreshResponse;
  await setAccessToken(data.accessToken);
  await setRefreshToken(data.refreshToken);
  return data.accessToken;
}

async function buildHeaders(extra?: HeadersInit): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(extra as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await buildHeaders(init.headers);
  return fetch(`${BASE_URL}${path}`, { ...init, headers });
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, init);

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await rawFetch(path, init);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && typeof body === "object" && "message" in body && String(body.message)) ||
      `Request failed: ${res.status}`;
    throw new ApiError(res.status, body, message);
  }

  return (await res.json()) as T;
}
