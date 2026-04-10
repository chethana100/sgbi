import { NextResponse, NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token")
  const { pathname } = request.nextUrl

  // If trying to access protected home page but no session, redirect to login
  if (pathname === "/" && !sessionToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // If already logged in and trying to access login/signup, redirect home
  if ((pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup")) && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/auth/login", "/auth/signup"],
}
