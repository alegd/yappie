import "./globals.css";

export const metadata = {
  title: "Yappie",
  description: "Turn audio recordings into actionable Jira tickets with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
