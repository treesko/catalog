"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    product_id: "",
    product_name: "",
    category: "",
    description: "",
    price: "",
    barcode: "",
    stock: "",
    image: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
          stock: parseInt(form.stock) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create product");
        return;
      }

      router.push("/products");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="p-2 rounded-xl hover:bg-cream-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-charcoal" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">New Product</h1>
          <p className="text-sm text-slate-muted">Add a new product to the catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5 animate-fade-in-up stagger-1">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-terracotta-light border border-orange-200 animate-scale-in">
            <span className="text-sm text-terracotta font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">
              Product ID *
            </label>
            <input type="text" value={form.product_id} onChange={(e) => update("product_id", e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">
              Product Name *
            </label>
            <input type="text" value={form.product_name} onChange={(e) => update("product_name", e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Category</label>
            <input type="text" value={form.category} onChange={(e) => update("category", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Price (EUR)</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Barcode</label>
            <input type="text" value={form.barcode} onChange={(e) => update("barcode", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Stock</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Image URL</label>
          <input type="url" value={form.image} onChange={(e) => update("image", e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="input-field resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating..." : "Create Product"}
          </button>
          <Link href="/products" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
