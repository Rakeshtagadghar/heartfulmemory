import { NextResponse, type NextRequest } from "next/server";

function hasAuthSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token")
  );
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
