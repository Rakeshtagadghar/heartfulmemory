import { NextResponse, type NextRequest } from "next/server";

function hasAuthSessionCookie(request: NextRequest) {
  const names = request.cookies.getAll().map((cookie) => cookie.name);
  const prefixes = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.session-token",
    "__Secure-authjs.session-token"
  ];

  return names.some((name) => prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}.`)));
}

export function middleware(request: NextRequest) {
  if (!hasAuthSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"]
};
