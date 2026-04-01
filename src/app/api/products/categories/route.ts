import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .not("category", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories = [...new Set((data || []).map((d) => d.category).filter(Boolean))].sort();
  return NextResponse.json(categories);
}
