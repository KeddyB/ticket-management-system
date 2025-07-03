import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("Middleware check for:", pathname)

  // Skip middleware for ALL API routes, login page, setup page, and static files
  if (
    pathname.startsWith("/api/") ||
    pathname === "/admin/login" ||
    pathname === "/setup" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/static/")
  ) {
    console.log("Skipping middleware for:", pathname)
    return NextResponse.next()
  }

  // Only protect admin pages (not API routes)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("auth-token")?.value
    console.log("Middleware: Token present for", pathname, ":", !!token)

    if (!token) {
      console.log("Middleware: No token found, redirecting to login")
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token is valid
    try {
      const { jwtVerify } = await import("jose")
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "your-secret-key")
      await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
      console.log("Middleware: Token verified, allowing access to", pathname)
    } catch (error) {
      console.log("Middleware: Invalid token, redirecting to login")
      const loginUrl = new URL("/admin/login", request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set("auth-token", "", { maxAge: 0 })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - EXCLUDED
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
