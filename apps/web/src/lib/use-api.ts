"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "./api";

export function useApi() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.accessToken) {
      api.setToken(session.accessToken);
    }
  }, [session?.accessToken]);

  return api;
}
