import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createServerClient } from "./supabase/server";
import type { Session } from "@/types";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE_NAME = "session";

export async function encrypt(payload: Session): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function decrypt(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; session: Session } | { error: string }> {
  const supabase = createServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, password, access")
    .eq("username", username)
    .single();

  if (error || !user) {
    return { error: "Invalid username or password" };
  }

  if (user.password !== password) {
    return { error: "Invalid username or password" };
  }

  const session: Session = {
    userId: user.id,
    username: user.username,
    access: user.access,
  };

  const token = await encrypt(session);
  return { token, session };
}

export { COOKIE_NAME };
