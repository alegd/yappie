import { createNavigation } from "next-intl/navigation";
import { pathnames, routing } from "./routing";

export const { usePathname, useRouter } = createNavigation({
  locales: routing.locales,
  localePrefix: routing.localePrefix,
  pathnames,
});
