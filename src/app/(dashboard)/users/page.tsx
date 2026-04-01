"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Shield, ShieldCheck, User } from "lucide-react";
import { ROLES } from "@/types";
import { useSession } from "@/components/layout/SessionProvider";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: number;
  username: string;
  access: number;
  created_at: string;
}

export default function UsersPage() {
  const session = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchUsers() {
    setLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function roleBadge(access: number) {
    const config: Record<number, { className: string; icon: typeof Shield }> = {
      1: { className: "badge-purple", icon: ShieldCheck },
      2: { className: "badge-blue", icon: Shield },
      3: { className: "badge-slate", icon: User },
    };
    const c = config[access] || config[3];
    const Icon = c.icon;
    return (
      <span className={`badge ${c.className} flex items-center gap-1.5`}>
        <Icon className="w-3 h-3" />
        {ROLES[access] || "Unknown"}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Users</h1>
          <p className="text-sm text-slate-muted mt-0.5">Manage system access and roles</p>
        </div>
        <Link href="/users/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add User
        </Link>
      </div>

      <div className="card overflow-hidden animate-fade-in-up stagger-1">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))
          ) : (
            users.map((user, i) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-deep flex items-center justify-center text-white text-xs font-bold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{user.username}</p>
                    <div className="mt-1">{roleBadge(user.access)}</div>
                  </div>
                </div>
                {user.id !== session.userId ? (
                  <button
                    onClick={() => setDeleteId(user.id)}
                    className="p-2 rounded-lg text-slate-muted hover:text-terracotta hover:bg-terracotta-light transition-all duration-200"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-sand italic">You</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="!py-5 !px-5">
                      <div className="skeleton h-4 w-3/4" />
                    </td>
                  </tr>
                ))
              ) : (
                users.map((user, i) => (
                  <tr
                    key={user.id}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <td className="text-sm text-slate-muted font-mono">{user.id}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-deep flex items-center justify-center text-white text-xs font-bold uppercase">
                          {user.username.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-charcoal">{user.username}</span>
                      </div>
                    </td>
                    <td>{roleBadge(user.access)}</td>
                    <td className="text-sm text-slate-muted">{formatDate(user.created_at)}</td>
                    <td>
                      {user.id !== session.userId ? (
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="p-2 rounded-lg text-slate-muted hover:text-terracotta hover:bg-terracotta-light transition-all duration-200"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-sand italic">You</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="card p-6 max-w-sm w-full mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-charcoal">Delete User</h3>
            <p className="text-sm text-slate-muted mt-2">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="btn-primary flex-1 justify-center !bg-terracotta hover:!bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
