import "./globals.css";

import { ThemeWrapper } from "@/components/theme-wrapper";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Sora } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

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
  metadataBase: process.env.NEXT_PUBLIC_HOST_URL
    ? new URL(process.env.NEXT_PUBLIC_HOST_URL)
    : undefined,
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
      <body
        className={`${dmSans.variable} ${sora.variable} bg-background text-foreground font-body antialiased`}
      >
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
