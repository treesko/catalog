import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const [productsRes, ordersRes, lowStockRes, recentOrdersRes] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount, created_at, tax_amount"),
      supabase.from("products").select("product_id, product_name, stock").lt("stock", 10),
      supabase
        .from("orders")
        .select("id, created_at, total_amount, item_count, pharmacy_id")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Get pharmacy names for recent orders
  const pharmacyIds = [
    ...new Set(
      (recentOrdersRes.data || [])
        .map((o) => o.pharmacy_id)
        .filter(Boolean)
    ),
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

  const orders = ordersRes.data || [];
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalTax = orders.reduce((sum, o) => sum + (o.tax_amount || 0), 0);

  // Revenue by month
  const revenueByMonth: Record<string, number> = {};
  for (const order of orders) {
    const date = new Date(order.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + (order.total_amount || 0);
  }

  const revenueChart = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

  const recentOrders = (recentOrdersRes.data || []).map((o) => ({
    ...o,
    pharmacy_name: pharmacyMap[o.pharmacy_id] || "Unknown",
  }));

  return NextResponse.json({
    totalProducts: productsRes.count || 0,
    totalOrders: orders.length,
    totalRevenue,
    totalTax,
    lowStockItems: lowStockRes.data || [],
    revenueChart,
    recentOrders,
  });
}
