"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-end p-12"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -left-20 w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full border border-white/10"
        />
        <div
          className="absolute top-20 right-40 w-24 h-24 rounded-full border border-white/[0.07]"
        />

        <div className="relative z-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1
            className="text-5xl text-white mb-4 leading-tight heading-serif"
          >
            Catallogu
          </h1>
          <p className="text-lg text-white/60 max-w-md leading-relaxed">
            Pharmacy catalog management platform. Manage your products, orders, and pharmacy network from one place.
          </p>
          <div className="mt-12 flex gap-6 text-white/40 text-sm">
            <div>
              <span className="block text-2xl font-semibold text-white/80">868</span>
              Pharmacies
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <span className="block text-2xl font-semibold text-white/80">20+</span>
              Products
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <span className="block text-2xl font-semibold text-white/80">24/7</span>
              Access
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-[380px] animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl heading-serif text-emerald-deep">Catallogu</h1>
            <p className="text-sm text-slate-muted mt-1">Pharmacy Management</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-charcoal tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-muted text-sm mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl animate-scale-in"
                style={{ background: "#fff7ed", border: "1.5px solid #fed7aa" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-sm text-terracotta font-medium">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field focus-ring"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field focus-ring"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-[0.9375rem] mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-sand mt-8">
            Contact your administrator for account access
          </p>
        </div>
      </div>
    </div>
  );
}
