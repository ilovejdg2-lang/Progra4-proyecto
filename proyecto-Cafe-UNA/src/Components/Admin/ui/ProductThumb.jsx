import { Package } from "lucide-react";

import { FotoMini } from "../../FotoMini";
import { imagenPrincipalProducto } from "../../../lib/productoImagenes";
import { t } from "../../../lib/t";

/** 40px product thumbnail with a neutral placeholder; shared by the admin product and stock lists. */
export function ProductThumb({ product }) {
  const foto = imagenPrincipalProducto(product);
  return (
    <FotoMini
      src={foto}
      alt=""
      className="size-10 shrink-0 rounded-md object-cover ring-1 ring-[var(--admin-border)]"
      fallback={
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--admin-surface-hover)] text-[color:var(--admin-text-muted)]"
          role="img"
          aria-label={t("Producto sin imagen")}
        >
          <Package className="size-4" aria-hidden="true" />
        </span>
      }
    />
  );
}
