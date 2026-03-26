// Buffer before actual expiry to refresh proactively (2 minutes)
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

export function decodeJwtExp(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return payload.exp * 1000; // convert seconds to milliseconds
  } catch {
    return 0;
  }
}

export function isTokenExpired(accessToken: string): boolean {
  const exp = decodeJwtExp(accessToken);
  return exp > 0 && Date.now() >= exp - REFRESH_BUFFER_MS;
}
