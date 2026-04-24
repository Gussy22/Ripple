import { NextRequest, NextResponse } from "next/server";
import { verifierTokenMagicLink, genererCookieSession, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.redirect(new URL("/compte/connexion?erreur=lien-invalide", req.url));
  }

  const email = verifierTokenMagicLink(token);

  if (!email) {
    return NextResponse.redirect(new URL("/compte/connexion?erreur=lien-expire", req.url));
  }

  const cookieValue = genererCookieSession(email);

  const response = NextResponse.redirect(new URL("/compte", req.url));
  response.cookies.set(COOKIE_NAME, cookieValue, COOKIE_OPTIONS);

  return response;
}
