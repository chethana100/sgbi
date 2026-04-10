import { NextResponse, NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token") || 
                       request.cookies.get("__secure-next-auth.session_token") ||
                       request.cookies.get("better-auth.session_token.0"); 
  
  const { pathname } = request.nextUrl

  // Protected routes
  const isProtectedRoute = pathname === "/" || 
                           pathname.startsWith("/dashboard") || 
                           pathname.startsWith("/admin") || 
                           pathname.startsWith("/assets") ||
                           pathname.startsWith("/alerts") ||
                           pathname.startsWith("/profile");

  const isAuthRoute = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/assets/:path*", "/alerts/:path*", "/profile/:path*", "/auth/login", "/auth/signup"],
}

