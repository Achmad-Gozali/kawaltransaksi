import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/laporan-publik"];
const authRoutes = ["/login", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("refresh_token")?.value;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuth = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && token) {
  const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/";
  return NextResponse.redirect(new URL(redirectTo, req.url));
}

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|icons|banks|ewallets|public).*)"],
};