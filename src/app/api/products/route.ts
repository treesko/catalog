import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const stockFilter = searchParams.get("stock") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createServerClient();
  let query = supabase
    .from("products")
    .select("*", { count: "exact" });

  if (search) {
    query = query.ilike("product_name", `%${search}%`);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (stockFilter === "out") {
    query = query.eq("stock", 0);
  } else if (stockFilter === "low") {
    query = query.gt("stock", 0).lt("stock", 10);
  } else if (stockFilter === "in") {
    query = query.gt("stock", 0);
  }

  const { data, count, error } = await query
    .order("product_name")
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count || 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("products")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
