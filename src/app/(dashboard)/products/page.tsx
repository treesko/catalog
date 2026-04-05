"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Search, Info, FileDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSession } from "@/components/layout/SessionProvider";
import { canManageProducts } from "@/lib/roles";
import { formatCurrency } from "@/lib/utils";
import { SortableProductRow, SortableProductCard } from "@/components/products/SortableProductRow";
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const reorderingRef = useRef(false);
  const pageSize = 10;

  const canEdit = canManageProducts(session.access);
  const filtersActive = !!(search || category || stockFilter);
  const canReorder = canEdit && !filtersActive;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

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

    return fetch(`/api/products?${params}`)
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

  async function handleOrderChange(productId: string, newOrder: number) {
    if (reorderingRef.current) return;
    reorderingRef.current = true;

    try {
      const currentProduct = products.find((p) => p.product_id === productId);
      if (!currentProduct || currentProduct.display_order === newOrder) return;

      // Single request: server handles fetch, reorder, renumber, and returns updated page
      const res = await fetch("/api/products/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, newPosition: newOrder, page, pageSize }),
      });

      const result = await res.json();
      if (result.data) {
        setProducts(result.data);
        setTotal(result.total);
      }
    } finally {
      reorderingRef.current = false;
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || reorderingRef.current) return;
    reorderingRef.current = true;

    const oldIndex = products.findIndex((p) => p.product_id === active.id);
    const newIndex = products.findIndex((p) => p.product_id === over.id);
    const reordered = arrayMove(products, oldIndex, newIndex);

    // Reassign display_order values based on new positions
    const baseOrder = (page - 1) * pageSize + 1;
    const updates = reordered.map((p, i) => ({
      product_id: p.product_id,
      display_order: baseOrder + i,
    }));

    // Optimistic update first, then persist after animation settles
    setProducts(
      reordered.map((p, i) => ({ ...p, display_order: baseOrder + i }))
    );

    setTimeout(async () => {
      await fetch("/api/products/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      reorderingRef.current = false;
    }, 150);
  }

  async function handlePriceChange(productId: string, newPrice: number) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === productId ? { ...p, price: newPrice } : p
      )
    );

    await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: newPrice }),
    });
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const response = await fetch("/api/export-products?title=Product+Catalog");
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_catalog_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExportingPdf(false);
    }
  }

  function stockBadge(stock: number) {
    if (stock === 0) return <span className="badge badge-terracotta">Out of stock</span>;
    if (stock < 10) return <span className="badge badge-amber">{stock} left</span>;
    return <span className="badge badge-emerald">{stock} in stock</span>;
  }

  const productIds = products.map((p) => p.product_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Products</h1>
          <p className="text-sm text-slate-muted mt-0.5">{total} total products in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            {exportingPdf ? "Generating..." : "Export PDF"}
          </button>
          {canEdit && (
            <Link href="/products/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      <div className="card overflow-hidden animate-fade-in-up stagger-1">
        {/* Filters */}
        <div className="p-4 border-b border-black/[0.04] flex flex-col md:flex-row gap-3 bg-cream/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input-field !w-auto flex-1 md:flex-none md:min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              className="input-field !w-auto flex-1 md:flex-none md:min-w-[140px]"
            >
              <option value="">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Filter active notice */}
        {canEdit && filtersActive && (
          <div className="px-4 py-2.5 bg-amber-light/50 border-b border-amber-warm/20 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-warm flex-shrink-0" />
            <span className="text-xs text-amber-warm font-medium">Clear filters to enable drag-and-drop reordering</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="divide-y divide-black/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 md:px-5">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-muted">No products found</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={canReorder ? handleDragEnd : undefined}
          >
            <SortableContext items={productIds} strategy={verticalListSortingStrategy}>
              {/* Mobile cards */}
              <div className="md:hidden">
                {products.map((product, i) => (
                  <div
                    key={product.product_id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <SortableProductCard
                      product={product}
                      canReorder={canReorder}
                      canEdit={canEdit}
                      onOrderChange={handleOrderChange}
                      onPriceChange={handlePriceChange}
                    />
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="!w-[90px]">#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Barcode</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, i) => (
                      <SortableProductRow
                        key={product.product_id}
                        product={product}
                        canReorder={canReorder}
                        canEdit={canEdit}
                        onOrderChange={handleOrderChange}
                        onPriceChange={handlePriceChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </SortableContext>
          </DndContext>
        )}

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
