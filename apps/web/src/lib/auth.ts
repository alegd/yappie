import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Refresh 60 seconds before actual expiry to avoid edge cases
const ACCESS_TOKEN_MAX_AGE = 14 * 60 * 1000; // 14 min (backend JWT_EXPIRATION is 15m)

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    console.log("[Auth] Refreshing access token...");

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      console.log("[Auth] Refresh failed:", response.status);
      return { ...token, error: "RefreshTokenExpired" };
    }

    const data = await response.json();
    console.log("[Auth] Token refreshed successfully");

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_MAX_AGE,
      error: undefined,
    };
  } catch (err) {
    console.error("[Auth] Refresh error:", err);
    return { ...token, error: "RefreshTokenError" };
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
    async jwt({ token, user }) {
      // Initial sign in — store tokens and expiry
      if (user) {
        console.log("[Auth] Initial sign in, setting tokens");
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          userId: user.id,
          accessTokenExpires: Date.now() + ACCESS_TOKEN_MAX_AGE,
        };
      }

      // Check if token needs refresh
      const expiresAt = token.accessTokenExpires as number | undefined;

      if (expiresAt && Date.now() >= expiresAt) {
        console.log("[Auth] Token expired, refreshing...");
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
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
