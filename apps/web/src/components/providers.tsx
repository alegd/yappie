"use client";

import { SwrConfig } from "@/config/swr.config";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SwrConfig>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}

          <Toaster
            position="bottom-center"
            theme="dark"
            closeButton={false}
            duration={5000}
            toastOptions={{
              style: {
                fontSize: "14px",
              },
            }}
          />
        </ThemeProvider>
      </SwrConfig>
    </SessionProvider>
  );
}
