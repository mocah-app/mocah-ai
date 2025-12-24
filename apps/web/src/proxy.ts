import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Use getSessionCookie for optimistic check
  const sessionCookie = getSessionCookie(request);

  const authRoutes = ["/login", "/register", "/reset-password"];
  const publicRoutes = ["/privacy", "/terms", "/contact"];

  // Protect dashboard routes - protect all paths under /app
  if (request.nextUrl.pathname.startsWith("/app")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (sessionCookie && authRoutes.includes(request.nextUrl.pathname)) {
    const appUrl = new URL("/app", request.url);
    
    // Preserve query params (e.g., plan and interval from pricing flow)
    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get("plan");
    const interval = searchParams.get("interval");
    
    if (plan && interval) {
      // Existing user from pricing flow
      appUrl.searchParams.set("existing-user", "true");
      appUrl.searchParams.set("plan", plan);
      appUrl.searchParams.set("interval", interval);
    }
    
    return NextResponse.redirect(appUrl);
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
