import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-must-be-32-chars-minimum!!"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("san_ws_session")?.value;

  const isAuthPage = pathname.startsWith("/login");
  const isAdmin = pathname.startsWith("/admin");
  const isWorker = pathname.startsWith("/worker");

  if (!token && (isAdmin || isWorker)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = payload.role as string;

      if (isAuthPage) {
        const dest = role === "ADMIN" ? "/admin/dashboard" : "/worker/dashboard";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      if (isAdmin && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/worker/dashboard", req.url));
      }
      if (isWorker && role !== "WORKER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.set("san_ws_session", "", { maxAge: 0 });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/worker/:path*", "/login"],
};
