import { auth } from "@/config/auth.config";
import { AUDIOS_PAGE, AUTH_PAGE, HOME_PAGE } from "@/lib/constants/pages";
import Link from "next/link";

export async function PublicNavbar() {
  const session = await auth();

  return (
    <nav className="fixed w-full bg-background/65 backdrop-blur-md">
      <div className="flex justify-between items-center mx-auto px-6 py-4 max-w-6xl mx-auto">
        <Link href={HOME_PAGE} className="font-bold text-xl tracking-tight">
          Yappie
        </Link>
        <div className="flex items-center gap-6">
          {session?.user ? (
            <Link
              href={AUDIOS_PAGE}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg font-medium text-white  transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href={AUTH_PAGE}
                className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg font-medium text-white  transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
