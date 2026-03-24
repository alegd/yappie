import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LOGIN_PAGE } from "@/lib/constants/pages";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Buffer before actual expiry to refresh proactively (2 minutes)
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

// Mutex to prevent concurrent refresh calls (token rotation race condition)
let refreshPromise: Promise<Record<string, unknown>> | null = null;

function decodeJwtExp(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return payload.exp * 1000; // convert seconds to milliseconds
  } catch {
    return 0;
  }
}

function isTokenExpired(accessToken: string): boolean {
  const exp = decodeJwtExp(accessToken);
  return exp > 0 && Date.now() >= exp - REFRESH_BUFFER_MS;
}

async function refreshAccessToken(token: Record<string, unknown>) {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });

      if (!response.ok) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      const data = await response.json();

      return {
        ...token,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        error: undefined,
      };
    } catch {
      return { ...token, error: "RefreshTokenError" };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) return null;

        const data = await response.json();

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          userId: user.id,
        };
      }

      const accessToken = token.accessToken as string;
      if (accessToken && isTokenExpired(accessToken)) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.userId as string;

      if (token.error) {
        session.error = token.error as string;
      }

      return session;
    },
  },
  pages: {
    signIn: LOGIN_PAGE,
  },
  session: {
    strategy: "jwt",
  },
});
