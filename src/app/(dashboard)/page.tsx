"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingCart, DollarSign, AlertTriangle, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Analytics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  lowStockItems: { product_id: string; product_name: string; stock: number }[];
  revenueChart: { month: string; revenue: number }[];
  recentOrders: {
    id: number;
    created_at: string;
    total_amount: number;
    item_count: number;
    pharmacy_name: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-4 w-20 mb-3" />
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-charcoal tracking-tight">
          <span className="heading-serif">Good day</span>
        </h1>
        <p className="text-slate-muted text-sm mt-1">
          Here&apos;s what&apos;s happening with your pharmacy network
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={data.totalProducts}
          icon={Package}
          variant="emerald"
          delay={0.05}
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders}
          icon={ShoppingCart}
          variant="slate"
          delay={0.1}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          variant="emerald"
          delay={0.15}
        />
        <StatCard
          title="Low Stock"
          value={data.lowStockItems.length}
          icon={AlertTriangle}
          variant={data.lowStockItems.length > 0 ? "terracotta" : "emerald"}
          delay={0.2}
        />
      </div>

      {/* Charts + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.revenueChart} />

        <div className="card p-6 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-muted">
              Recent Orders
            </h3>
            <Link
              href="/orders"
              className="text-xs font-medium text-emerald-mid hover:text-emerald-deep flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0.5">
            {data.recentOrders.map((order, i) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-cream transition-colors duration-200 animate-fade-in"
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-subtle flex items-center justify-center text-emerald-deep text-xs font-bold">
                    #{order.id}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {order.pharmacy_name}
                    </p>
                    <p className="text-xs text-slate-muted">
                      {formatDateTime(order.created_at)} &middot; {order.item_count} items
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-charcoal">
                  {formatCurrency(order.total_amount)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockItems.length > 0 && (
        <div className="card p-6 animate-fade-in-up stagger-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-muted mb-4">
            Low Stock Alerts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lowStockItems.map((item) => (
              <Link
                key={item.product_id}
                href={`/products/${item.product_id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-terracotta-light/50 hover:bg-terracotta-light transition-colors duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-terracotta" />
                  </div>
                  <span className="text-sm font-medium text-charcoal">
                    {item.product_name}
                  </span>
                </div>
                <span className="badge badge-terracotta">
                  {item.stock} left
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
