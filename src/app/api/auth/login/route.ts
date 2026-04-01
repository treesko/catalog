import { NextRequest, NextResponse } from "next/server";
import { login, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const result = await login(username, password);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, session: result.session });
  response.cookies.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
