"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/layout/SessionProvider";
import { canManageProducts } from "@/lib/roles";
import type { Product } from "@/types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const session = useSession();
  const router = useRouter();
  const canEdit = canManageProducts(session.access);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    product_name: "",
    category: "",
    description: "",
    price: "",
    barcode: "",
    stock: "",
    image: "",
  });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setForm({
          product_name: data.product_name || "",
          category: data.category || "",
          description: data.description || "",
          price: String(data.price || 0),
          barcode: data.barcode || "",
          stock: String(data.stock || 0),
          image: data.image || "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
          stock: parseInt(form.stock) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update product");
        return;
      }

      router.push("/products");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/products");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-slate-muted">
        Product not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 rounded-xl hover:bg-cream-dark transition-colors">
            <ArrowLeft className="w-5 h-5 text-charcoal" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-charcoal tracking-tight">
              {canEdit ? "Edit Product" : "Product Details"}
            </h1>
            <p className="text-sm text-slate-muted">ID: {product.product_id}</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowDeleteModal(true)} className="btn-danger">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5 animate-fade-in-up stagger-1">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-terracotta-light border border-orange-200 animate-scale-in">
            <span className="text-sm text-terracotta font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Product ID</label>
            <input type="text" value={product.product_id} disabled className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Product Name</label>
            <input type="text" value={form.product_name} onChange={(e) => update("product_name", e.target.value)} disabled={!canEdit} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Category</label>
            <input type="text" value={form.category} onChange={(e) => update("category", e.target.value)} disabled={!canEdit} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Price (EUR)</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} disabled={!canEdit} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Barcode</label>
            <input type="text" value={form.barcode} onChange={(e) => update("barcode", e.target.value)} disabled={!canEdit} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Stock</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} disabled={!canEdit} className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Image URL</label>
          <input type="url" value={form.image} onChange={(e) => update("image", e.target.value)} disabled={!canEdit} className="input-field" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} disabled={!canEdit} rows={4} className="input-field resize-none" />
        </div>

        {canEdit && (
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/products" className="btn-secondary">Cancel</Link>
          </div>
        )}
      </form>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="card p-6 max-w-sm w-full mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-charcoal">Delete Product</h3>
            <p className="text-sm text-slate-muted mt-2">
              Are you sure you want to delete &ldquo;{product.product_name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={handleDelete} disabled={deleting} className="btn-primary flex-1 justify-center !bg-terracotta hover:!bg-red-700">
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
