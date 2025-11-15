import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Middleware to protect routes and manage authentication
 * Runs on every request to specified paths
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Auth routes (login, register) - redirect based on user role if already logged in
  if (isPublicRoute && user) {
    // Check user role to determine where to redirect
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Redirect admins to admin panel, others (practitioners, assistants, staff) to dashboard
      const redirectUrl = profile?.role === 'admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
      // If we can't fetch role, default to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ["/dashboard", "/clients", "/appointments", "/calendar", "/settings", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes - check if user has admin role
  if (pathname.startsWith('/admin') && user) {
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If not admin, redirect to dashboard
      if (!profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      // If we can't verify role, redirect to dashboard for safety
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
