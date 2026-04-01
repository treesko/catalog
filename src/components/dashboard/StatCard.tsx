import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "emerald",
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "emerald" | "amber" | "terracotta" | "slate";
  delay?: number;
}) {
  const styles = {
    emerald: {
      iconBg: "bg-emerald-subtle",
      iconColor: "text-emerald-mid",
      accentBar: "bg-emerald-mid",
    },
    amber: {
      iconBg: "bg-amber-light",
      iconColor: "text-amber-warm",
      accentBar: "bg-amber-warm",
    },
    terracotta: {
      iconBg: "bg-terracotta-light",
      iconColor: "text-terracotta",
      accentBar: "bg-terracotta",
    },
    slate: {
      iconBg: "bg-cream-dark",
      iconColor: "text-slate-muted",
      accentBar: "bg-slate-muted",
    },
  };

  const s = styles[variant];

  return (
    <div
      className="card p-6 relative overflow-hidden animate-fade-in-up group hover:shadow-md transition-shadow duration-300"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.accentBar} opacity-60`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-muted mb-2">
            {title}
          </p>
          <p className="text-[1.75rem] font-bold text-charcoal tracking-tight leading-none">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl ${s.iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${s.iconColor}`} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
