import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { History, Pencil, Power, PowerOff } from "lucide-react";

import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { AdminOverflowMenu } from "../../../../Components/Admin/ui/AdminOverflowMenu";
import {
  AdminModal,
  AdminModalActions,
  AdminModalFooter,
  AdminModalHeader,
} from "../../../../Components/Admin/ui/AdminModal";

const SALES_ROUTE = "/admin/puntos-venta/$locationCode/ventas";

// Filled danger is reserved for the confirmation of a destructive action inside the modal.
const dangerPrimaryCls =
  "inline-flex min-h-[var(--control-height)] w-full items-center justify-center rounded-full border border-[var(--admin-status-danger-text)] bg-[var(--admin-status-danger-text)] px-5 text-[length:var(--text-body)] font-bold text-[color:var(--admin-surface)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--admin-focus-ring)]";

function useMetaLine(location, productCount, unitCount) {
  const tActivo = useTraducir("Activo");
  const tInactivo = useTraducir("Inactivo");
  const tProducto = useTraducir("producto");
  const tProductos = useTraducir("productos");
  const tUnidad = useTraducir("unidad");
  const tUnidades = useTraducir("unidades");
  const parts = [location.code, location.activo === false ? tInactivo : tActivo];
  if (Number.isFinite(productCount)) parts.push(`${productCount} ${productCount === 1 ? tProducto : tProductos}`);
  if (Number.isFinite(unitCount)) parts.push(`${unitCount} ${unitCount === 1 ? tUnidad : tUnidades}`);
  return parts.join(" · ");
}

function DeactivateConfirm({ location, busy, onCancel, onConfirm }) {
  const tTitulo = useTraducir("Inactivar");
  const titleId = `pv-deactivate-${location.code}`;
  return (
    <AdminModal open onClose={busy ? undefined : onCancel} labelledBy={titleId} maxWidth="max-w-md">
      <AdminModalHeader
        icon={PowerOff}
        title={`${tTitulo} ${location.name}`}
        titleId={titleId}
        description="Mientras esté inactivo no se podrá consultar ni ajustar su stock. Podés volver a activarlo cuando quieras."
        onClose={busy ? undefined : onCancel}
      />
      <AdminModalFooter>
        <AdminModalActions
          variant="coffee"
          onCancel={onCancel}
          cancelLabel="Cancelar"
          primaryLabel={busy ? "Inactivando..." : "Inactivar"}
          primaryType="button"
          primaryDisabled={busy}
          onPrimary={onConfirm}
          primaryClassName={dangerPrimaryCls}
        />
      </AdminModalFooter>
    </AdminModal>
  );
}

/**
 * Header of the selected location: name, one muted meta line (code, status and the
 * totals that are available) and the actions. Secondary and destructive actions live
 * in the overflow menu; inactivating always asks for confirmation.
 */
export function PointOfSaleLocationHeader({
  location,
  productCount = null,
  unitCount = null,
  canManage = false,
  onEdit,
  onToggleActivo,
  toggling = false,
}) {
  const [confirming, setConfirming] = useState(false);
  const activo = location.activo !== false;
  const meta = useMetaLine(location, productCount, unitCount);
  const tMenu = useTraducir("Más acciones de");

  const confirmDeactivate = async () => {
    try {
      await onToggleActivo?.(location);
    } finally {
      setConfirming(false);
    }
  };

  const items = [
    { key: "history", label: "Historial de ventas", icon: History, to: SALES_ROUTE, params: { locationCode: location.code }, className: "@lg:hidden" },
    { key: "edit", label: "Editar", icon: Pencil, onSelect: () => onEdit?.(location) },
    activo
      ? { key: "deactivate", label: "Inactivar", icon: PowerOff, tone: "danger", onSelect: () => setConfirming(true) }
      : { key: "activate", label: "Activar", icon: Power, onSelect: () => onToggleActivo?.(location) },
  ];

  return (
    <div className="flex min-w-0 items-start justify-between gap-3 px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="break-words text-[length:var(--text-subtitle)] font-bold leading-tight text-[color:var(--admin-text-primary)]!">
          <ST>{location.name}</ST>
        </h2>
        <p className="mt-1! break-words text-xs text-[color:var(--admin-text-muted)]!">{meta}</p>
      </div>
      <div className="-my-1 flex shrink-0 items-center gap-1">
        <Link
          to={SALES_ROUTE}
          params={{ locationCode: location.code }}
          className={`${canManage ? "hidden @lg:inline-flex" : "inline-flex"} min-h-[var(--control-height)] items-center gap-2 rounded-full px-4 text-[length:var(--text-body)] font-semibold text-[color:var(--admin-text-muted)] no-underline transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[color:var(--admin-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]`}
        >
          <History className="size-4 shrink-0" aria-hidden="true" />
          <ST>Historial de ventas</ST>
        </Link>
        {canManage ? <AdminOverflowMenu label={`${tMenu} ${location.name}`} items={items} /> : null}
      </div>
      {confirming ? (
        <DeactivateConfirm
          location={location}
          busy={toggling}
          onCancel={() => setConfirming(false)}
          onConfirm={confirmDeactivate}
        />
      ) : null}
    </div>
  );
}
