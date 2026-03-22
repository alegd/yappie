import { auth } from "@/lib/auth";
import { LandingPage } from "@/features/landing/landing-page";

export default async function Home() {
  const session = await auth();
  return <LandingPage isAuthenticated={!!session} />;
}
