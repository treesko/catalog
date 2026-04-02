import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.access > 2) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { updates } = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
  }

  const supabase = createServerClient();

  for (const { product_id, display_order } of updates) {
    const { error } = await supabase
      .from("products")
      .update({ display_order })
      .eq("product_id", product_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
