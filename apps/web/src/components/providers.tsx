"use client";

import { SwrConfig } from "@/config/swr.config";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

dayjs.extend(localizedFormat);

const timeZone = "Europe/Vienna";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}) {
  return (
    <SessionProvider>
      <SwrConfig>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
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
        </NextIntlClientProvider>
      </SwrConfig>
    </SessionProvider>
  );
}
