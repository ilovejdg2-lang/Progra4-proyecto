import { useEffect, useState } from "react";

import { ST } from "../T/ST";
import { t } from "../../lib/t";
import { obtenerBlobComprobanteCompra } from "../../services/comprasService";

export function ComprobantePago({ compraId, tieneComprobante }) {
  const [carga, setCarga] = useState({ compraId: null, url: "", error: "" });
  const actual = carga.compraId === compraId;
  const url = actual ? carga.url : "";
  const error = actual ? carga.error : "";

  useEffect(() => {
    if (!tieneComprobante || !compraId) return undefined;
    let activo = true;
    let objectUrl = "";
    obtenerBlobComprobanteCompra(compraId)
      .then((blob) => {
        if (!activo || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setCarga({ compraId, url: objectUrl, error: "" });
      })
      .catch((err) => {
        if (activo) {
          setCarga({
            compraId,
            url: "",
            error: err instanceof Error ? err.message : "No se pudo cargar el comprobante.",
          });
        }
      });
    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [compraId, tieneComprobante]);

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="text-[length:var(--text-body)] font-semibold text-slate-800"><ST>Comprobante de pago</ST></p>
      {!tieneComprobante ? (
        <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
          <ST>Esta compra no tiene comprobante adjunto.</ST>
        </p>
      ) : error ? (
        <p className="mt-1 text-[length:var(--text-body)] text-rose-700"><ST>{error}</ST></p>
      ) : url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 block">
          <img
            src={url}
            alt={t("Comprobante de pago")}
            className="max-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain"
          />
        </a>
      ) : (
        <p className="mt-1 text-[length:var(--text-body)] text-slate-500"><ST>Cargando comprobante...</ST></p>
      )}
    </div>
  );
}
