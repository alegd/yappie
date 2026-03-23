import { AUDIOS_PAGE, HOME_PAGE, LOGIN_PAGE, REGISTER_PAGE } from "@/lib/constants/pages";
import Link from "next/link";

interface PublicNavbarProps {
  isAuthenticated?: boolean;
}

export function PublicNavbar({ isAuthenticated = false }: PublicNavbarProps) {
  return (
    <nav className="flex justify-between items-center mx-auto px-6 py-4 max-w-6xl">
      <Link href={HOME_PAGE} className="font-bold text-xl tracking-tight">
        Yappie
      </Link>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Link
            href={AUDIOS_PAGE}
            className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg font-medium text-sm transition"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link href={LOGIN_PAGE} className="text-muted hover:text-foreground text-sm transition">
              Log in
            </Link>
            <Link
              href={REGISTER_PAGE}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg font-medium text-white text-sm transition"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
