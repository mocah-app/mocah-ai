import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Auth routes that logged-in users shouldn't access
  const authRoutes = ["/login", "/register", "/reset-password"];
  const isAuthRoute = authRoutes.includes(pathname);

  // If user is logged in and trying to access auth pages, redirect to dashboard
  // Note: getSessionCookie only checks for cookie existence, not full validation
  // Full validation happens in page/route handlers
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user visits /template directly (not /template/[id]), redirect to dashboard
  if (pathname === "/template") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match auth routes exactly
    "/login",
    "/register",
    "/reset-password",
    // Match /template but not /template/[id]
    "/template",
  ],
};
