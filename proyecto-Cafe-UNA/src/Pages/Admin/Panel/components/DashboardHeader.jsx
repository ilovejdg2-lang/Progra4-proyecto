import { CalendarDays } from "lucide-react";
import { ST } from "../../../../Components/T/ST";

export function DashboardHeader({ titulo, saludo, descripcion, fechaEtiqueta, saludoDia }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-[1.75rem]">
          <ST>{titulo}</ST>
        </h1>
        {saludo ? (
          <p className="mt-1 text-sm font-medium text-[#7a1f2b] dark:text-rose-300">{saludo}</p>
        ) : null}
        {descripcion ? (
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            <ST>{descripcion}</ST>
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
          {fechaEtiqueta}
        </p>
        {saludoDia ? (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            <ST>{saludoDia}</ST>
          </p>
        ) : null}
      </div>
    </header>
  );
}
