import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.access > 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  const updates: Record<string, unknown> = {};
  if (body.access !== undefined) updates.access = body.access;
  if (body.password) updates.password = body.password;
  if (body.username) updates.username = body.username;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", parseInt(id))
    .select("id, username, access, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.access > 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (parseInt(id) === session.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
