"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface OrderDetail {
  id: number;
  created_at: string;
  total_amount: number;
  tax_amount: number;
  item_count: number;
  discount_total: number;
  subtotal_no_tax: number;
  pharmacy_name: string;
  items: {
    id: number;
    product_id: string;
    product_name: string;
    shifra: number | null;
    quantity: number;
    price: number;
    discount: number;
  }[];
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-6" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-slate-muted">Order not found</div>;
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-2 rounded-xl hover:bg-cream-dark transition-colors">
          <ArrowLeft className="w-5 h-5 text-charcoal" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">
            Order #{order.id}
          </h1>
          <p className="text-sm text-slate-muted">{formatDateTime(order.created_at)}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up stagger-1">
        {[
          { label: "Pharmacy", value: order.pharmacy_name },
          { label: "Items", value: order.item_count },
          { label: "Tax", value: formatCurrency(order.tax_amount) },
          { label: "Total", value: formatCurrency(order.total_amount) },
        ].map((item, i) => (
          <div key={i} className="card p-4">
            <p className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-muted mb-1">{item.label}</p>
            <p className="text-sm font-semibold text-charcoal truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Items table */}
      <div className="card overflow-hidden animate-fade-in-up stagger-2">
        <div className="px-6 py-4 border-b border-black/[0.04]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-muted">Order Items</h3>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {order.items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                  {item.shifra != null && (
                    <p className="text-xs text-slate-muted font-mono">Shifra: {item.shifra}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-slate">{item.quantity}x</span>
                    <span className="text-xs text-slate-muted">@ {formatCurrency(item.price)}</span>
                    {item.discount > 0 && (
                      <span className="text-xs text-terracotta">-{formatCurrency(item.discount)}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-charcoal flex-shrink-0">
                  {formatCurrency(item.quantity * item.price - item.discount)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Shifra</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="table-row-hover">
                  <td>
                    <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                    <p className="text-xs text-slate-muted">ID: {item.product_id}</p>
                  </td>
                  <td className="text-sm font-mono text-slate-muted">{item.shifra ?? "—"}</td>
                  <td><span className="badge badge-slate">{item.quantity}</span></td>
                  <td className="text-sm text-slate-muted">{formatCurrency(item.price)}</td>
                  <td className="text-sm text-slate-muted">{formatCurrency(item.discount)}</td>
                  <td className="text-sm font-semibold text-charcoal">{formatCurrency(item.quantity * item.price - item.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-black/[0.04] bg-cream/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Subtotal (excl. tax)</span>
            <span className="text-charcoal">{formatCurrency(order.subtotal_no_tax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Tax</span>
            <span className="text-charcoal">{formatCurrency(order.tax_amount)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-muted">Discount</span>
              <span className="text-terracotta">-{formatCurrency(order.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-black/[0.06]">
            <span className="text-charcoal">Total</span>
            <span className="text-emerald-deep">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
