"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

// Note: NextIntlClientProvider is intentionally omitted — auth pages
// do not use translations. Add it here if i18n is introduced in auth flows.
export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
