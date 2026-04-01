import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const pharmacyId = searchParams.get("pharmacyId") || "";
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createServerClient();
  let query = supabase
    .from("orders")
    .select("*", { count: "exact" });

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59");
  }
  if (pharmacyId) {
    query = query.eq("pharmacy_id", parseInt(pharmacyId));
  }

  const { data: orders, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get pharmacy names
  const pharmacyIds = [
    ...new Set((orders || []).map((o) => o.pharmacy_id).filter(Boolean)),
  ];

  let pharmacyMap: Record<number, string> = {};
  if (pharmacyIds.length > 0) {
    const { data: pharmacies } = await supabase
      .from("pharmacies")
      .select("id, Barnatoret")
      .in("id", pharmacyIds);
    pharmacyMap = Object.fromEntries(
      (pharmacies || []).map((p) => [p.id, p.Barnatoret])
    );
  }

  const enriched = (orders || []).map((o) => ({
    ...o,
    pharmacy_name: pharmacyMap[o.pharmacy_id] || "Unknown",
  }));

  return NextResponse.json({ data: enriched, total: count || 0, page, pageSize });
}
