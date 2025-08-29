import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { UserStatus } from "@/generated/prisma";

/**
 * Authentication and Route Protection Middleware
 *
 * This middleware handles:
 * 1. JWT token validation for protected routes
 * 2. User status checking (ACTIVE/SUSPENDED/TERMINATED)
 * 3. Route protection for dashboard, admin, and API endpoints
 * 4. Automatic redirect to login for unauthenticated users
 * 5. Redirect authenticated users away from auth pages
 * 6. User context injection into API request headers
 *
 * Protected routes require valid JWT token and ACTIVE user status.
 * Auth routes (login/register) redirect authenticated users to dashboard.
 */

// Define protected routes
const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin",
  "/api/upload",
  "/api/products",
  "/api/dashboard",
];

// Define admin-only routes
const ADMIN_ROUTES = ["/admin", "/api/admin"];

// Define auth routes (redirect if already authenticated)
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from Authorization header or cookies
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.replace("Bearer ", "") ||
    request.cookies.get("auth-token")?.value;

  // Check if current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // For non-protected routes (except auth routes), continue normally
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // If no token is provided for protected routes
  if (isProtectedRoute && !token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Redirect to login page for UI routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If token exists, verify it
  if (token) {
    const payload = AuthService.verifyToken(token);

    if (!payload) {
      // Invalid token
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 }
        );
      }

      // Redirect to login for UI routes
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }

    // Check user status
    if (payload.status !== UserStatus.ACTIVE) {
      if (pathname.startsWith("/api/")) {
        const statusMessages = {
          [UserStatus.SUSPENDED]: "Your account has been suspended",
          [UserStatus.TERMINATED]: "Your account has been terminated",
        };

        return NextResponse.json(
          { error: statusMessages[payload.status] || "Account not active" },
          { status: 403 }
        );
      }

      // Redirect to account status page for UI routes
      const response = NextResponse.redirect(
        new URL("/account-inactive", request.url)
      );
      response.cookies.delete("auth-token");
      return response;
    }

    // Check admin routes (for future admin functionality)
    if (isAdminRoute) {
      // For now, all active users can access admin routes
      // In the future, you might want to add an admin role check here
    }

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Add user info to headers for API routes
    if (pathname.startsWith("/api/")) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-status", payload.status);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.ico$).*)",
  ],
  runtime: 'nodejs'
};
