import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createServerClient();
  let query = supabase
    .from("pharmacies")
    .select("*", { count: "exact" });

  if (city) {
    query = query.eq("Qyteti", city);
  }
  if (search) {
    query = query.or(
      `Barnatoret.ilike.%${search}%,Farmacisti Përgjegjës.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query
    .order("Barnatoret")
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count || 0, page, pageSize });
}
