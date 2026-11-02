import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "fallback-secret-key-rosa-pasion-club";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = "rosa_pasion_admin_token";

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
}

/**
 * Genera un token JWT firmado válido por 7 días
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * Verifica y decodifica un token JWT
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Obtiene la sesión actual desde las cookies en Server Components / Server Actions
 */
export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Establece la cookie de sesión HttpOnly
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

/**
 * Remueve la cookie de sesión
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Compara contraseña plana con hash
 */
export async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plain, hashed);
}

/**
 * Hashea una contraseña con bcryptjs
 */
export async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, 12);
}

export { COOKIE_NAME };
