import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "fallback-secret-key-rosa-pasion-club";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = "rosa_pasion_admin_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isValidSession = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      if (payload && payload.userId) {
        isValidSession = true;
      }
    } catch {
      isValidSession = false;
    }
  }

  // 1. Proteger todas las rutas de /admin
  if (pathname.startsWith("/admin")) {
    if (!isValidSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete(COOKIE_NAME);
      }
      return response;
    }
    return NextResponse.next();
  }

  // 2. Si ya está autenticado y visita /login, redirigir a /admin
  if (pathname === "/login") {
    if (isValidSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
