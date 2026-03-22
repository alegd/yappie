import "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }
}
