import { PowerOff } from "lucide-react";

import {
  AdminModal,
  AdminModalActions,
  AdminModalFooter,
  AdminModalHeader,
  adminBtnDangerPrimary,
} from "../../../../Components/Admin/ui/AdminModal";
import { useTraducir } from "../../../../hooks/useTraducir";

/** Asks before deactivating a product. Activating is non-destructive and never asks. */
export function ProductDeactivateConfirm({ producto, busy = false, onCancel, onConfirm }) {
  const tTitulo = useTraducir("Desactivar");
  const titleId = `producto-desactivar-${String(producto.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <AdminModal open onClose={busy ? undefined : onCancel} labelledBy={titleId} maxWidth="max-w-md">
      <AdminModalHeader
        icon={PowerOff}
        title={`${tTitulo} ${producto.nombre}`}
        titleId={titleId}
        description="Dejará de estar disponible en la tienda. Podés volver a activarlo cuando quieras."
        onClose={busy ? undefined : onCancel}
      />
      <AdminModalFooter>
        <AdminModalActions
          variant="coffee"
          onCancel={onCancel}
          cancelLabel="Cancelar"
          primaryLabel={busy ? "Desactivando..." : "Desactivar"}
          primaryType="button"
          primaryDisabled={busy}
          cancelDisabled={busy}
          onPrimary={onConfirm}
          primaryClassName={adminBtnDangerPrimary}
        />
      </AdminModalFooter>
    </AdminModal>
  );
}
