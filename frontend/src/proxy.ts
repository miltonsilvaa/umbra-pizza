import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/cookies";

/**
 * Checagem otimista: só olha se o cookie existe.
 * A validade real do token é confirmada pela API (GET /me e interceptor 401).
 */
export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(TOKEN_COOKIE);
  const { pathname } = request.nextUrl;

  const isPrivate = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/" || pathname === "/signup";

  if (isPrivate && !hasToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPage && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signup", "/dashboard/:path*"],
};
