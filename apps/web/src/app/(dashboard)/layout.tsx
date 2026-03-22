import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/layout/dashboard-content";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
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
