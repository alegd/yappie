"use client";

import { AUTH_PAGE } from "@/lib/constants/pages";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    signOut({
      callbackUrl: AUTH_PAGE,
      redirect: true,
    });
  }, []);

  return (
    <div className="space-y-4 mt-24">
      <p>Logging out...</p>
    </div>
  );
}
