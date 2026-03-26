import { LOGIN_PAGE } from "@/lib/constants/pages";
import { decodeJwtExp } from "@/lib/jwt-utils";
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const SESSION_EXP_MULTIPLIER = 1000;

function isTokenExpired(token: JWT): boolean {
  const exp = token.accessTokenExp as number | undefined;
  if (!exp) return true;
  return exp * SESSION_EXP_MULTIPLIER < Date.now();
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; accessTokenExp: number }> {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("RefreshTokenError");
  }

  const data = await response.json();
  const accessTokenExp = decodeJwtExp(data.accessToken) / SESSION_EXP_MULTIPLIER;

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExp,
  };
}

// Mutex: concurrent jwt callback invocations share the same in-flight
// refresh request. Both proxy and /api/auth/session run in the Node
// runtime (see proxy.ts and route.ts), so this module-level variable
// is shared across all invocations in the same process.
let pendingRefresh: Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExp: number;
}> | null = null;

async function refreshJwt(token: JWT): Promise<JWT> {
  if (pendingRefresh) {
    try {
      const result = await pendingRefresh;
      return { ...token, ...result, error: undefined };
    } catch {
      return { ...token, error: "RefreshTokenError" };
    }
  }

  pendingRefresh = refreshAccessToken(token.refreshToken as string);

  try {
    const result = await pendingRefresh;
    return { ...token, ...result, error: undefined };
  } catch {
    return { ...token, error: "RefreshTokenError" };
  } finally {
    pendingRefresh = null;
  }
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
    async jwt({ token: rawToken, user }): Promise<JWT> {
      const token = rawToken as JWT;

      if (isTokenExpired(token) && token.refreshToken) {
        return refreshJwt(token);
      }

      if (user) {
        const accessTokenExp = decodeJwtExp(user.accessToken as string) / SESSION_EXP_MULTIPLIER;

        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExp,
          userId: user.id,
        };
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
