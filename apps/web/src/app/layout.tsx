import "./globals.css";

import type { Metadata } from "next";
import { Providers } from "@/components/providers";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
