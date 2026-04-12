import { auth } from "@/config/auth.config";
import { LandingPage } from "@/features/landing/landing-page";
import { AUTH_PAGE, SETTINGS_PAGE } from "@/lib/constants/pages";

export default async function Home() {
  const session = await auth();
  const upgradeHref = session?.user ? `${SETTINGS_PAGE}#billing` : AUTH_PAGE;

  return <LandingPage upgradeHref={upgradeHref} />;
}
