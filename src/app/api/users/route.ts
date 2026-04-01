import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.access > 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, access, created_at")
    .order("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.access > 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { username, password, access } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Check uniqueness
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Username already exists" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ username, password, access: access || 3 })
    .select("id, username, access, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
