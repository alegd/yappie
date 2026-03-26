import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "./globals.css";

import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: {
    default: "Yappie — Audio to Jira Tickets with AI",
    template: "%s | Yappie",
  },
  description:
    "Record voice notes, let AI decompose them into tasks, and export structured tickets to Jira. Built for product managers and tech leads.",
  openGraph: {
    title: "Yappie — Audio to Jira Tickets with AI",
    description:
      "Record voice notes, let AI decompose them into tasks, and export structured tickets to Jira.",
    type: "website",
    locale: "en_US",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const messages = await getMessages();

  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-foreground font-body antialiased">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
