import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const clone = [...arr];
  const [item] = clone.splice(from, 1);
  clone.splice(to, 0, item);
  return clone;
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.access > 2) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createServerClient();

  // Mode 1: Move a single product to a new position (text input reorder)
  if (body.productId && body.newPosition !== undefined) {
    const { productId, newPosition, page = 1, pageSize = 10 } = body;

    // Fetch all products sorted by display_order
    const { data: allProducts, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .order("display_order")
      .order("product_name");

    if (fetchError || !allProducts) {
      return NextResponse.json({ error: fetchError?.message || "Failed to fetch" }, { status: 500 });
    }

    // Find current index and clamp target
    const currentIndex = allProducts.findIndex((p) => p.product_id === productId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetIndex = Math.max(0, Math.min(newPosition - 1, allProducts.length - 1));
    if (currentIndex === targetIndex) {
      // No change needed — return current page
      const from = (page - 1) * pageSize;
      const pageData = allProducts.slice(from, from + pageSize);
      return NextResponse.json({ data: pageData, total: allProducts.length });
    }

    // Reorder and renumber
    const reordered = arrayMove(allProducts, currentIndex, targetIndex);
    const updates: { product_id: string; display_order: number }[] = [];
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].display_order !== i + 1) {
        updates.push({ product_id: reordered[i].product_id, display_order: i + 1 });
        reordered[i] = { ...reordered[i], display_order: i + 1 };
      }
    }

    // Persist only changed products
    for (const { product_id, display_order } of updates) {
      const { error } = await supabase
        .from("products")
        .update({ display_order })
        .eq("product_id", product_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Return the requested page
    const from = (page - 1) * pageSize;
    const pageData = reordered.slice(from, from + pageSize);
    return NextResponse.json({ data: pageData, total: reordered.length });
  }

  // Mode 2: Batch updates (drag-and-drop)
  const { updates } = body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
  }

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
