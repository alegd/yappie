import { auth } from "@/config/auth.config";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { CALLBACK_URL_KEY } from "./lib/constants/common";
import { HOME_PAGE, LOGIN_PAGE, REGISTER_PAGE } from "./lib/constants/pages";

const authPages = [LOGIN_PAGE, REGISTER_PAGE];

const publicPages = [HOME_PAGE];

const intlMiddleware = createIntlMiddleware({
  ...routing,
});

export default auth(async function proxy(req) {
  const { nextUrl } = req;

  // Session is already available via req.auth (injected by the auth() wrapper).
  // Do NOT call auth() again — it triggers a second jwt callback that revokes
  // the refresh token before the first one can persist the new cookie.
  const isAuthenticated = !!req.auth?.user;

  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join("|")}))?(${publicPages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")})/?(.+)?$`,
    "i",
  );

  const isPublicPage = publicPathnameRegex.test(nextUrl.pathname);

  if (authPages.includes(nextUrl.pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isPublicPage && !isAuthenticated) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;

    return NextResponse.redirect(
      new URL(`${LOGIN_PAGE}?${CALLBACK_URL_KEY}=${encodeURIComponent(callbackUrl)}`, req.url),
    );
  }

  return intlMiddleware(req);
});

export const runtime = "nodejs";

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
