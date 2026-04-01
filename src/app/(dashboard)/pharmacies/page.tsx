"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Building2 } from "lucide-react";
import type { Pharmacy } from "@/types";

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  useEffect(() => {
    fetch("/api/pharmacies/cities")
      .then((res) => res.json())
      .then(setCities);
  }, []);

  const fetchPharmacies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (city) params.set("city", city);

    fetch(`/api/pharmacies?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPharmacies(data.data || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, city]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Pharmacies</h1>
          <span className="badge badge-emerald">{total} registered</span>
        </div>
        <p className="text-sm text-slate-muted">Kosovo pharmacy network directory</p>
      </div>

      <div className="card overflow-hidden animate-fade-in-up stagger-1">
        {/* Filters */}
        <div className="p-4 border-b border-black/[0.04] flex flex-col md:flex-row gap-3 bg-cream/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand" />
            <input
              type="text"
              placeholder="Search by name or pharmacist..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            className="input-field !w-auto md:min-w-[180px]"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))
          ) : pharmacies.length === 0 ? (
            <div className="py-12 text-center text-slate-muted">No pharmacies found</div>
          ) : (
            pharmacies.map((pharmacy, i) => (
              <div
                key={pharmacy.id}
                className="p-4 animate-fade-in"
                style={{ animationDelay: `${i * 0.02}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-subtle flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-mid" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-charcoal">{pharmacy.Barnatoret || "—"}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="badge badge-slate">{pharmacy.Qyteti || "—"}</span>
                      {pharmacy["Farmacisti Përgjegjës"] && (
                        <span className="text-xs text-slate-muted truncate">{pharmacy["Farmacisti Përgjegjës"]}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pharmacy</th>
                <th>City</th>
                <th>Business License</th>
                <th>Renewal Date</th>
                <th>Pharmacist</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="!py-5 !px-5">
                      <div className="skeleton h-4 w-3/4" />
                    </td>
                  </tr>
                ))
              ) : pharmacies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="!py-12 text-center text-slate-muted">
                    No pharmacies found
                  </td>
                </tr>
              ) : (
                pharmacies.map((pharmacy, i) => (
                  <tr
                    key={pharmacy.id}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${i * 0.02}s` }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-subtle flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-emerald-mid" />
                        </div>
                        <span className="text-sm font-semibold text-charcoal">
                          {pharmacy.Barnatoret || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-slate">{pharmacy.Qyteti || "—"}</span>
                    </td>
                    <td className="font-mono text-xs text-slate-muted">
                      {pharmacy["Licenca e Veprimtarisë"] || "—"}
                    </td>
                    <td className="text-sm text-slate-muted">
                      {pharmacy["Data e Përtrirjes"] || "—"}
                    </td>
                    <td className="text-sm text-charcoal-light">
                      {pharmacy["Farmacisti Përgjegjës"] || "—"}
                    </td>
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
