import { Link } from "@tanstack/react-router";
import { AlertTriangle, Package } from "lucide-react";
import { ST } from "../../../../Components/T/ST";
import { requestAdminStockProduct } from "../../../../lib/adminStockAlert";
import { normalizeImageUrl } from "../../../../lib/imageUtils";

export function StockAlerts({
  alertas,
  loading,
  error,
  tReponer,
  limite = 3,
}) {
  const visibles = alertas.slice(0, limite);
  const hayMas = alertas.length > limite;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              <ST>Alertas de stock</ST>
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            <ST>Productos que requieren atención.</ST>
          </p>
        </div>
        {hayMas ? (
          <Link to="/admin/producto" className="text-xs font-semibold text-slate-500 hover:text-[#7a1f2b]">
            <ST>Ver todas</ST>
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-600"><ST>{error}</ST></p>
      ) : alertas.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          <ST>No hay productos con stock crítico.</ST>
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {visibles.map((item) => {
            const foto = item.imagen ? normalizeImageUrl(item.imagen, { width: 80 }) : "";
            return (
              <li key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  {foto ? (
                    <img
                      src={foto}
                      alt=""
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                      <Package className="size-5" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {item.nombre}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          item.agotado
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                        }`}
                      >
                        <ST>{item.agotado ? "Agotado" : "Bajo mínimo"}</ST>
                      </span>
                      <span className="text-slate-500">
                        <ST>Stock</ST>: {item.stockActual} · <ST>Mínimo</ST>: {item.stockMinimo}
                      </span>
                    </div>
                    {item.ubicaciones?.length ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.ubicaciones.map((ubi) => `${ubi.nombre}: ${ubi.stock}`).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Link
                  to="/admin/producto"
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                  onClick={() => requestAdminStockProduct(item.id, { nombre: item.nombre })}
                >
                  {tReponer}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
