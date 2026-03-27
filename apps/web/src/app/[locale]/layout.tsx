import "./globals.css";

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_HOST_URL!),
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  twitter: {
    card: "summary_large_image",
    title: "Yappie — Audio to Jira Tickets with AI",
    description:
      "Record voice notes, let AI decompose them into tasks, and export structured tickets to Jira.",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-foreground font-body antialiased">{children}</body>
    </html>
  );
}
