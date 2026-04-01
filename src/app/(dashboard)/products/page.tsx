"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Package } from "lucide-react";
import { useSession } from "@/components/layout/SessionProvider";
import { canManageProducts } from "@/lib/roles";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export default function ProductsPage() {
  const session = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    fetch("/api/products/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (stockFilter) params.set("stock", stockFilter);

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, category, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(total / pageSize);

  function stockBadge(stock: number) {
    if (stock === 0) return <span className="badge badge-terracotta">Out of stock</span>;
    if (stock < 10) return <span className="badge badge-amber">{stock} left</span>;
    return <span className="badge badge-emerald">{stock} in stock</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Products</h1>
          <p className="text-sm text-slate-muted mt-0.5">{total} total products in catalog</p>
        </div>
        {canManageProducts(session.access) && (
          <Link href="/products/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        )}
      </div>

      <div className="card overflow-hidden animate-fade-in-up stagger-1">
        {/* Filters */}
        <div className="p-4 border-b border-black/[0.04] flex flex-wrap gap-3 bg-cream/50">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input-field !w-auto min-w-[160px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
            className="input-field !w-auto min-w-[140px]"
          >
            <option value="">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Barcode</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="!py-5 !px-5">
                      <div className="skeleton h-4 w-3/4" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="!py-12 text-center text-slate-muted">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, i) => (
                  <tr
                    key={product.product_id}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td>
                      <Link
                        href={`/products/${product.product_id}`}
                        className="flex items-center gap-3 group"
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.product_name}
                            className="w-10 h-10 rounded-xl object-cover bg-cream-dark"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center text-sand">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-charcoal group-hover:text-emerald-mid transition-colors">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-slate-muted">ID: {product.product_id}</p>
                        </div>
                      </Link>
                    </td>
                    <td>
                      {product.category ? (
                        <span className="badge badge-slate">{product.category}</span>
                      ) : (
                        <span className="text-sand">—</span>
                      )}
                    </td>
                    <td className="font-semibold text-charcoal">{formatCurrency(product.price)}</td>
                    <td className="font-mono text-xs text-slate-muted">{product.barcode || "—"}</td>
                    <td>{stockBadge(product.stock)}</td>
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
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
