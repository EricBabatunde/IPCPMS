import { auth } from "@/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPublicRoute = publicRoutes.some((r) => req.nextUrl.pathname.startsWith(r))

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
}
