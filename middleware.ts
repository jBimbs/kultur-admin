import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/festivals", "/historical-sites", "/artifacts", "/local-cuisines"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    const adminSession = request.cookies.get("admin_session");

    if (!adminSession) {
      // Redirect to login with callback URL
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/festivals/:path*", "/historical-sites/:path*", "/artifacts/:path*", "/local-cuisines/:path*"],
};
