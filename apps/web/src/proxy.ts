import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { CALLBACK_URL_KEY } from "./lib/constants/common";
import { HOME_PAGE, LOGIN_PAGE, REGISTER_PAGE } from "./lib/constants/pages";

const authPages = [LOGIN_PAGE, REGISTER_PAGE];

const publicPages = [HOME_PAGE];

export default auth(async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  const session = await auth();

  const isAuthenticated = !!session;

  const publicPathnameRegex = RegExp(
    `^(/)?(${publicPages.flatMap((p) => (p === "/" ? ["", "/"] : p)).join("|")})/?(.+)?$`,
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
