"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface OrderRow {
  id: number;
  created_at: string;
  total_amount: number;
  tax_amount: number;
  item_count: number;
  discount_total: number;
  subtotal_no_tax: number;
  pharmacy_name: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    fetch(`/api/orders?${params}`)
      .then((res) => res.json())
      .then((data) => {
        let filtered = data.data || [];
        if (pharmacySearch) {
          filtered = filtered.filter((o: OrderRow) =>
            o.pharmacy_name.toLowerCase().includes(pharmacySearch.toLowerCase())
          );
        }
        setOrders(filtered);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, dateFrom, dateTo, pharmacySearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Orders</h1>
        <p className="text-sm text-slate-muted mt-0.5">{total} total orders</p>
      </div>

      <div className="card overflow-hidden animate-fade-in-up stagger-1">
        {/* Filters */}
        <div className="p-4 border-b border-black/[0.04] flex flex-col md:flex-row gap-3 bg-cream/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand" />
            <input
              type="text"
              placeholder="Search by pharmacy..."
              value={pharmacySearch}
              onChange={(e) => setPharmacySearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 flex-1 md:flex-none">
              <span className="text-xs text-slate-muted font-medium">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="input-field !w-auto flex-1"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 md:flex-none">
              <span className="text-xs text-slate-muted font-medium">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="input-field !w-auto flex-1"
              />
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-muted">No orders found</div>
          ) : (
            orders.map((order, i) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block p-4 hover:bg-cream/60 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-emerald-mid">Order #{order.id}</span>
                  <span className="text-sm font-bold text-charcoal">{formatCurrency(order.total_amount)}</span>
                </div>
                <p className="text-sm text-charcoal">{order.pharmacy_name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-muted">{formatDateTime(order.created_at)}</span>
                  <span className="badge badge-slate">{order.item_count} items</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Pharmacy</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="!py-5 !px-5">
                      <div className="skeleton h-4 w-3/4" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="!py-12 text-center text-slate-muted">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td>
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-mid hover:text-emerald-deep transition-colors"
                      >
                        #{order.id}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="text-sm text-slate-muted">{formatDateTime(order.created_at)}</td>
                    <td className="text-sm font-medium text-charcoal">{order.pharmacy_name}</td>
                    <td>
                      <span className="badge badge-slate">{order.item_count}</span>
                    </td>
                    <td className="text-sm text-slate-muted">{formatCurrency(order.subtotal_no_tax)}</td>
                    <td className="text-sm text-slate-muted">{formatCurrency(order.tax_amount)}</td>
                    <td className="text-sm font-bold text-charcoal">{formatCurrency(order.total_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-black/[0.04] bg-cream/30">
            <p className="text-xs text-slate-muted">
              Showing <span className="font-semibold text-charcoal">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</span> of {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40">
                Previous
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
