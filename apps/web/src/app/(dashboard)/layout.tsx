import { DashboardContent } from "@/components/layout/dashboard-content";
import { auth } from "@/lib/auth";
import { LOGIN_PAGE } from "@/lib/constants/pages";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect(LOGIN_PAGE);
  }

  return (
    <DashboardContent
      user={{
        name: session.user?.name || "",
        email: session.user?.email || "",
      }}
    >
      {children}
    </DashboardContent>
  );
}
