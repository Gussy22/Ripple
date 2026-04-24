import crypto from "crypto";

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.SERVICE_SECRET || "dearly-session-fallback";
}

/** Génère un token de magic link valide 1 heure */
export function genererTokenMagicLink(email: string): string {
  const exp = Date.now() + 60 * 60 * 1000; // 1 heure
  const payload = `${email}|${exp}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

/** Vérifie le token magic link. Retourne l'email ou null. */
export function verifierTokenMagicLink(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length < 3) return null;

    const sig = parts.pop()!;
    const exp = Number(parts.pop()!);
    const email = parts.join("|");

    if (Date.now() > exp) return null; // expiré

    const payload = `${email}|${exp}`;
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    if (sig !== expectedSig) return null; // signature invalide

    return email;
  } catch {
    return null;
  }
}

/** Génère la valeur du cookie de session (valide 30 jours) */
export function genererCookieSession(email: string): string {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 jours
  const payload = `${email}|${exp}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

/** Vérifie le cookie de session. Retourne l'email ou null. */
export function verifierCookieSession(cookie: string): string | null {
  try {
    const decoded = Buffer.from(cookie, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length < 3) return null;

    const sig = parts.pop()!;
    const exp = Number(parts.pop()!);
    const email = parts.join("|");

    if (Date.now() > exp) return null;

    const payload = `${email}|${exp}`;
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    if (sig !== expectedSig) return null;

    return email;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "dearly_auth";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
  secure: process.env.NODE_ENV === "production",
};
