// Buffer before actual expiry to refresh proactively
// TODO: revert to 2 * 60 * 1000 after testing
const REFRESH_BUFFER_MS = 15 * 1000; // 15 seconds for testing

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
