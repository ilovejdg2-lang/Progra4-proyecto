import { Link } from "@tanstack/react-router";
import { ST } from "../../../../Components/T/ST";

export function QuickAccess({ items, gestionarTo }) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          <ST>Acceso rápido</ST>
        </h2>
        {gestionarTo ? (
          <Link to={gestionarTo} className="text-xs font-semibold text-slate-500 hover:text-[#7a1f2b]">
            <ST>Gestionar módulos</ST>
          </Link>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.Icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#7a1f2b]/30 hover:bg-[#7a1f2b]/5 dark:border-slate-800 dark:text-slate-200"
            >
              <Icon className="size-4 shrink-0 text-[#7a1f2b]" aria-hidden="true" />
              <span className="leading-tight"><ST>{item.label}</ST></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
