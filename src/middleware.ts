import { NextRequest, NextResponse } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/export-products"];

const ADMIN_ONLY_PATHS = ["/users"];
const MANAGER_PATHS = ["/products/new"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await decrypt(token);
  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Role-based route protection
  if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p)) && session.access > 1) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (MANAGER_PATHS.some((p) => pathname.startsWith(p)) && session.access > 2) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check edit routes for products
  if (pathname.match(/^\/products\/[^/]+$/) && request.method !== "GET" && session.access > 2) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  // Inject session into headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-id", String(session.userId));
  response.headers.set("x-user-access", String(session.access));
  response.headers.set("x-user-name", session.username);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
