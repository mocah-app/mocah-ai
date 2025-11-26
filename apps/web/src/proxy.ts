import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Use getSessionCookie for optimistic check
  const sessionCookie = getSessionCookie(request);

  const authRoutes = ["/login", "/register", "/reset-password"];
  const publicRoutes = ["/privacy", "/terms", "/contact"];
  const protectedRoutes = ["/app", "/app/new"];

  // Protect dashboard routes
  if (protectedRoutes.includes(request.nextUrl.pathname)) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (sessionCookie && authRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
