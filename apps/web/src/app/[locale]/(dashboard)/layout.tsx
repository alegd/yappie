import { DashboardContent } from "@/components/layout/dashboard-content";
import { Providers } from "@/components/providers";
import { auth } from "@/config/auth.config";
import { LOGIN_PAGE } from "@/lib/constants/pages";
import { getMessages } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect(LOGIN_PAGE);
  }

  const { locale } = await params;
  const messages = await getMessages();

  return (
    <Providers locale={locale} messages={messages}>
      <DashboardContent
        user={{
          name: session.user?.name || "",
          email: session.user?.email || "",
        }}
      >
        {children}
      </DashboardContent>
    </Providers>
  );
}
