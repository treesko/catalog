"use client";

import { useState, useEffect } from "react";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Session } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session) setSession(data.session);
      });
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-emerald-deep flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-mid animate-pulse" />
            <span className="text-sm text-slate-muted font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-cream flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-8 max-w-[1400px]">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
