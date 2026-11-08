import { PackageOpen, Pencil, Power } from "lucide-react";
import { ST } from "../../../../Components/T/ST";
import { t } from "../../../../lib/t";

const actionButtonBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[length:var(--text-body)] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function ProductActions({
  producto,
  puedeEditar,
  puedeInactivar,
  puedeActualizarStock,
  onEditar,
  onToggleEstado,
  onEditarStock,
  variant = "table",
}) {
  const esDeshabilitado = producto.estado === "Deshabilitado";
  const esMovil = variant === "mobile";
  const bloquearInhabilitar = producto.esDestacado && !esDeshabilitado;
  const filaSuperior = puedeEditar && puedeActualizarStock;
  const etiquetaToggle = esDeshabilitado ? "Activar" : "Desactivar";

  const sizeClass = esMovil
    ? "h-[var(--control-height)] px-2.5"
    : "h-8 px-2";

  const editarClassName = `${actionButtonBase} ${sizeClass} admin-role-quiet`;
  const toggleClassName = `${actionButtonBase} ${sizeClass} ${
    esDeshabilitado
      ? "admin-role-positive"
      : "admin-role-danger"
  }`;
  const stockClassName = `${actionButtonBase} ${sizeClass} admin-role-quiet`;

  return (
    <div
      className={`product-actions grid gap-1 ${esMovil ? "w-full gap-2" : "w-[10.5rem]"} ${
        filaSuperior && !esMovil ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {puedeEditar ? (
        <button type="button" onClick={onEditar} className={editarClassName}>
          <Pencil className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Editar</ST></span>
        </button>
      ) : null}
      {puedeActualizarStock ? (
        <button type="button" onClick={onEditarStock} className={stockClassName}>
          <PackageOpen className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Stock</ST></span>
        </button>
      ) : null}
      {puedeInactivar ? (
        <button
          type="button"
          onClick={onToggleEstado}
          disabled={bloquearInhabilitar}
          title={bloquearInhabilitar ? t("Quita el destacado antes de desactivarlo") : undefined}
          className={`${toggleClassName} disabled:cursor-not-allowed disabled:opacity-50 ${filaSuperior && !esMovil ? "col-span-2" : ""}`}
        >
          <Power className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>{etiquetaToggle}</ST></span>
        </button>
      ) : null}
    </div>
  );
}
