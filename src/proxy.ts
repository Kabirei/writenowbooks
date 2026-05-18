import { NextResponse } from "next/server";

export default function proxy(request: Request) {
  const url = new URL(request.url);

  if (
    url.pathname.startsWith("/admin") &&
    url.pathname !== "/admin-login"
  ) {
    const cookieHeader =
      request.headers.get("cookie") || "";

    const hasAccess =
      cookieHeader.includes(
        "admin_access=granted"
      );

    if (!hasAccess) {
      return NextResponse.redirect(
        new URL(
          "/admin-login",
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};