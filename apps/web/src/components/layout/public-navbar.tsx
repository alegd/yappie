import { auth } from "@/config/auth.config";
import { AUDIOS_PAGE, AUTH_PAGE, HOME_PAGE } from "@/lib/constants/pages";
import { Github } from "lucide-react";
import Link from "next/link";

export async function PublicNavbar() {
  const session = await auth();

  return (
    <nav className="fixed z-50 w-full bg-background/65 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={HOME_PAGE} className="text-xl font-bold tracking-tight">
          Yappie
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/#how-it-works" className="transition hover:text-foreground">
              How it works
            </Link>
            <Link href="/#pricing" className="transition hover:text-foreground">
              Pricing
            </Link>
            <a
              href="https://github.com/alegd/yappie"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
          </div>
          {session?.user ? (
            <Link
              href={AUDIOS_PAGE}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary-hover"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href={AUTH_PAGE}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary-hover"
            >
              Start for free
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
