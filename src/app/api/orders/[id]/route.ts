import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const [orderRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("*").eq("id", parseInt(id)).single(),
    supabase.from("order_items").select("*").eq("order_id", parseInt(id)),
  ]);

  if (orderRes.error) {
    return NextResponse.json({ error: orderRes.error.message }, { status: 404 });
  }

  const order = orderRes.data;
  const items = itemsRes.data || [];

  // Get pharmacy name
  let pharmacyName = "Unknown";
  if (order.pharmacy_id) {
    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("Barnatoret, Qyteti")
      .eq("id", order.pharmacy_id)
      .single();
    if (pharmacy) {
      pharmacyName = `${pharmacy.Barnatoret} (${pharmacy.Qyteti})`;
    }
  }

  // Get product names and shifra for items
  const productIds = [...new Set(items.map((i) => i.product_id))];
  let productMap: Record<string, { name: string; shifra: number | null }> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("product_id, product_name, shifra")
      .in("product_id", productIds);
    productMap = Object.fromEntries(
      (products || []).map((p) => [p.product_id, { name: p.product_name, shifra: p.shifra }])
    );
  }

  const enrichedItems = items.map((i) => ({
    ...i,
    product_name: productMap[i.product_id]?.name || i.product_id,
    shifra: productMap[i.product_id]?.shifra ?? null,
  }));

  return NextResponse.json({
    ...order,
    pharmacy_name: pharmacyName,
    items: enrichedItems,
  });
}
