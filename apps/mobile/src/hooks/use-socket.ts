import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth-store";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export function useSocket(): void {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    void connectSocket(queryClient);
    return () => {
      disconnectSocket();
    };
  }, [accessToken, queryClient]);
}
