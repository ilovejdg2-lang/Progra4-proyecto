import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { indicadorStockCantidad } from "../../../../lib/productoDisponibilidad";
import { obtenerStockDesglosadoProducto } from "../../../../services/productosService";

export function ProductLocationStockPanel({ productId, refreshKey = 0 }) {
  const [state, setState] = useState({ status: "idle", data: null, error: "" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    setState((current) =>
      current.status === "success" && current.data
        ? { ...current, error: "" }
        : { ...current, status: "loading", error: "" },
    );
    obtenerStockDesglosadoProducto(productId)
      .then((data) => {
        if (!cancelled) setState({ status: "success", data, error: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "No se pudo cargar el stock por ubicación.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, refreshKey, retryToken]);

  if (!productId) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stock por ubicación</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">Desglose actual</h3>
        </div>
        {state.status === "error" ? (
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-300 px-3 text-xs font-semibold text-slate-700"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Reintentar
          </button>
        ) : null}
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <p className="mt-3 text-sm text-slate-500">Cargando ubicaciones...</p>
      ) : state.status === "error" ? (
        <p className="mt-3 text-sm text-red-600">{state.error}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {(state.data?.locations || []).map((location) => {
              const indicador = indicadorStockCantidad(location.stock);
              return (
                <li
                  key={location.code}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{location.name}</p>
                    <p className="text-xs text-slate-500">{location.code}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 font-semibold ${indicador.clase}`}>
                    <span className={`size-2.5 rounded-full ${indicador.punto}`} aria-hidden="true" />
                    {indicador.etiqueta}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-right text-sm font-bold text-slate-950">
            Total consolidado: {state.data?.total ?? 0}
          </p>
        </>
      )}
    </section>
  );
}
