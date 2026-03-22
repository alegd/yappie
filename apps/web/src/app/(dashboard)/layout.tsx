import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/layout/dashboard-content";
import { LOGIN_PAGE } from "@/lib/constants/pages";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect(LOGIN_PAGE);
  }

  return (
    <DashboardContent
      accessToken={session.accessToken}
      user={{
        name: session.user?.name || "",
        email: session.user?.email || "",
      }}
    >
      {children}
    </DashboardContent>
  );
}
