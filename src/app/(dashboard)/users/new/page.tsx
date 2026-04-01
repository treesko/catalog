"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    access: "3",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          access: parseInt(form.access),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create user");
        return;
      }

      router.push("/users");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link href="/users" className="p-2 rounded-xl hover:bg-cream-dark transition-colors">
          <ArrowLeft className="w-5 h-5 text-charcoal" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">New User</h1>
          <p className="text-sm text-slate-muted">Create a new system user</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5 animate-fade-in-up stagger-1">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-terracotta-light border border-orange-200 animate-scale-in">
            <span className="text-sm text-terracotta font-medium">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Username *</label>
          <input type="text" value={form.username} onChange={(e) => update("username", e.target.value)} className="input-field" required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Password *</label>
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Role</label>
          <select value={form.access} onChange={(e) => update("access", e.target.value)} className="input-field">
            <option value="1">Admin</option>
            <option value="2">Manager</option>
            <option value="3">Seller</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating..." : "Create User"}
          </button>
          <Link href="/users" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
