import "server-only";

import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { ApiError } from "./api/errors";

export const SESSION_COOKIE = "qfs_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
/* Dev/test only. Production refuses to run without a real secret. */
const DEV_SESSION_SECRET = "qfs-dev-insecure-session-secret";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a value of at least 32 characters");
  }
  return DEV_SESSION_SECRET;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  avatarUrl: string;
  country: string;
  referralCode: string;
  memberSince: Date;
  kycLevel: number;
};

/* Keyed with SESSION_SECRET, so a leaked DB on its own is not enough to
   produce a valid tokenHash. */
function hashToken(token: string): string {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

function toSessionUser(u: {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  avatarUrl: string;
  country: string;
  referralCode: string;
  memberSince: Date;
  kycLevel: number;
}): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    avatarUrl: u.avatarUrl,
    country: u.country,
    referralCode: u.referralCode,
    memberSince: u.memberSince,
    kycLevel: u.kycLevel,
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

/** Returns the logged-in user or null. Verifies the token against the DB. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // A suspended account has no access at all, even with a live cookie.
  if (session.user.status !== "ACTIVE") {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw ApiError.unauthorized();
  if (user.status === "SUSPENDED") {
    await destroySession();
    throw new ApiError(403, "SUSPENDED", "This account has been suspended. Contact support.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw ApiError.forbidden();
  return user;
}

export async function destroySession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
}

/** Used by admins to force-logout a user (suspend, etc.). */
export async function revokeUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function setSessionCookie(token: string): Promise<void> {
  // Awaiting cookies() and .set() in a Route Handler attaches Set-Cookie to the response.
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}