import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-must-be-32-chars-minimum!!"
);
const COOKIE = "san_ws_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "WORKER";
  workerId?: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workerId: user.workerId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);

  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const dbSession = await prisma.session.findUnique({
      where: { token },
      include: { user: { include: { worker: true } } },
    });
    if (!dbSession || dbSession.expiresAt < new Date()) {
      await prisma.session.deleteMany({ where: { token } }).catch(() => {});
      return null;
    }
    if (!dbSession.user.active) return null;
    return {
      id: dbSession.user.id,
      email: dbSession.user.email,
      name: dbSession.user.name,
      role: dbSession.user.role as "ADMIN" | "WORKER",
      workerId: dbSession.user.worker?.id,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(
  role?: "ADMIN" | "WORKER"
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated", 401);
  if (role && session.role !== role) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { worker: true },
  });
  if (!user || !user.active) {
    return { ok: false, error: "Invalid email or password" };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Invalid email or password" };
  }
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "WORKER",
    workerId: user.worker?.id,
  };
  await createSession(sessionUser);
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    },
  });
  return { ok: true, user: sessionUser };
}
