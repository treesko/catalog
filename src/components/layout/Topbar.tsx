"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, ChevronRight } from "lucide-react";
import { useSession } from "./SessionProvider";
import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Products",
  "/products/new": "New Product",
  "/orders": "Orders",
  "/pharmacies": "Pharmacies",
  "/users": "Users",
  "/users/new": "New User",
};

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Breadcrumb
  const segments = pathname.split("/").filter(Boolean);
  const pageName =
    pageNames[pathname] ||
    (segments.length > 1
      ? `${pageNames["/" + segments[0]] || segments[0]} › Detail`
      : "Page");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-[72px] bg-white/70 backdrop-blur-md border-b border-black/[0.04] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-cream transition-colors"
        >
          <Menu className="w-5 h-5 text-charcoal" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          {segments.length === 0 ? (
            <span className="font-semibold text-charcoal">Dashboard</span>
          ) : (
            segments.map((seg, i) => {
              const isLast = i === segments.length - 1;
              const displayName = pageNames["/" + segments.slice(0, i + 1).join("/")] ||
                (seg.match(/^\d+$/) || seg.match(/^[a-f0-9-]+$/i) ? `#${seg}` : seg.charAt(0).toUpperCase() + seg.slice(1));
              return (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-sand" />}
                  <span
                    className={
                      isLast
                        ? "font-semibold text-charcoal"
                        : "text-slate-muted"
                    }
                  >
                    {displayName}
                  </span>
                </span>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream">
          <div className="w-6 h-6 rounded-md bg-emerald-deep flex items-center justify-center text-white text-[10px] font-bold uppercase">
            {session.username.charAt(0)}
          </div>
          <span className="text-sm font-medium text-charcoal">{session.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-muted hover:bg-terracotta-light hover:text-terracotta transition-all duration-200"
          title="Sign out"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
