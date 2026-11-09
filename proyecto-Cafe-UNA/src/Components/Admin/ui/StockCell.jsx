import { indicadorStockCantidad } from "../../../lib/productoDisponibilidad";
import { ST } from "../../T/ST";
import { StatusDot } from "./StatusDot";

const muted = "text-[color:var(--admin-text-muted)]";
const primary = "text-[color:var(--admin-text-primary)]";

/**
 * Number first, tabular. An amber dot plus a word ("Bajo" / "Agotado") marks low stock using the
 * existing POCAS_UNIDADES_MAX rule; everything else stays neutral. `stock` is the raw quantity
 * (null/undefined renders "Sin registro", `loading` renders the loading label).
 */
export function StockCell({ stock, loading = false }) {
  const indicador = indicadorStockCantidad(loading ? undefined : stock, loading);
  if (loading || stock === null || stock === undefined) {
    return <span className={muted}><ST>{indicador.etiqueta}</ST></span>;
  }
  const low = indicador.codigo === "pocas" || indicador.codigo === "agotado";
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {low ? (
        <span className={`inline-flex items-center gap-1.5 text-xs ${muted}`}>
          <StatusDot tone="warning" />
          <ST>{indicador.codigo === "agotado" ? "Agotado" : "Bajo"}</ST>
        </span>
      ) : null}
      <span className={`min-w-[2ch] text-right font-semibold tabular-nums ${primary}`}>{indicador.etiqueta}</span>
    </span>
  );
}
