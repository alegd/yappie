import { DEFAULT_LOCALE } from "@/lib/constants/common";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (
      await (locale === DEFAULT_LOCALE
        ? // When using Turbopack, this will enable HMR for `en`
          import(`../../locales/${DEFAULT_LOCALE}/common.json`)
        : import(`../../locales/${locale}/common.json`))
    ).default,
  };
});
