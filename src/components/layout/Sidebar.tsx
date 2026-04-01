"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Users,
  X,
} from "lucide-react";
import { useSession } from "./SessionProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, maxAccess: 3 },
  { label: "Products", href: "/products", icon: Package, maxAccess: 3 },
  { label: "Orders", href: "/orders", icon: ShoppingCart, maxAccess: 3 },
  { label: "Pharmacies", href: "/pharmacies", icon: Building2, maxAccess: 3 },
  { label: "Users", href: "/users", icon: Users, maxAccess: 1 },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const session = useSession();

  const filteredItems = navItems.filter(
    (item) => session.access <= item.maxAccess
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] transition-transform duration-300 ease-out lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:min-h-screen flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #064e3b 0%, #065f46 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[72px] px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Catallogu
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-1">
          <p className="px-3 mb-3 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-white/30">
            Menu
          </p>
          {filteredItems.map((item, i) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.8125rem] font-medium transition-all duration-200 animate-slide-in-left",
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/55 hover:bg-white/[0.08] hover:text-white/90"
                )}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="p-3 mt-auto">
          <div className="rounded-xl bg-white/[0.08] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold uppercase">
                {session.username.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.username}</p>
                <p className="text-xs text-white/40">
                  {session.access === 1 ? "Admin" : session.access === 2 ? "Manager" : "Seller"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
