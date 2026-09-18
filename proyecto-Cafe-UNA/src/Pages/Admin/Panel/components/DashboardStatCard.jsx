import { ST } from "../../../../Components/T/ST";

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  loading,
  accent = "slate",
}) {
  const deltaClass =
    delta == null
      ? ""
      : delta >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";
  const iconWrap = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    wine: "bg-[#7a1f2b]/10 text-[#7a1f2b] dark:bg-rose-950/40 dark:text-rose-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  }[accent];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <ST>{label}</ST>
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          ) : (
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {value}
            </p>
          )}
        </div>
        {Icon ? (
          <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {delta != null ? (
          <span className={`font-semibold ${deltaClass}`}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        ) : null}
        {hint ? <span><ST>{hint}</ST></span> : null}
      </div>
    </article>
  );
}
