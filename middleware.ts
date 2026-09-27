import { NextRequest, NextResponse } from "next/server";

/**
 * Cheap cookie-presence guard for the private dashboard area.
 * Real session verification happens in server components / route handlers.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/user/user/dashboard") || pathname.startsWith("/user/admin");

  // No cookie at all means definitely signed out, so bouncing to login is safe.
  //
  // We deliberately do NOT bounce the login/register pages to the dashboard here.
  // That check can only see that a cookie *exists*, not that it is valid, and a
  // stale, expired or revoked cookie then ping-pongs forever:
  //   dashboard -> login (session rejected) -> dashboard -> ...
  // The auth pages verify the session for real instead, so an invalid cookie
  // lands on a working login form rather than a redirect loop.
  if (isProtected && !req.cookies.get("qfs_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/user/user/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*"],
};