import { useState } from "react";
import { Package, X } from "lucide-react";

import { AdminModal, AdminModalActions, AdminModalBody, AdminModalHeader } from "../../../../Components/Admin/ui/AdminModal";

const MAX_STOCK = 2147483647;

export function PointOfSaleStockEditor({ open, location, product, stockRecord, onSave, onClose, isSaving = false, error = "" }) {
  const [stock, setStock] = useState(() => stockRecord?.stock === null || stockRecord?.stock === undefined ? "" : String(stockRecord.stock));
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");

  if (!open || !product) return null;

  const message = validationError || error;
  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedReason = reason.trim();
    const parsedStock = /^\d+$/.test(stock) ? Number(stock) : NaN;
    if (!Number.isSafeInteger(parsedStock) || parsedStock < 0 || parsedStock > MAX_STOCK) {
      setValidationError(`Ingrese un entero entre 0 y ${MAX_STOCK}.`);
      return;
    }
    if (normalizedReason.length < 1 || normalizedReason.length > 300) {
      setValidationError("El motivo debe tener entre 1 y 300 caracteres.");
      return;
    }
    setValidationError("");
    await onSave(parsedStock, normalizedReason);
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="pos-stock-editor-title">
      <AdminModalHeader>
        <div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Package className="size-5" aria-hidden="true" /></span><div className="min-w-0"><h2 id="pos-stock-editor-title" className="truncate text-lg font-semibold text-slate-950">Editar stock del punto</h2><p className="truncate text-sm text-slate-500">{product.nombre} · {location?.name}</p></div></div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" aria-label="Cerrar editor de stock"><X className="size-5" aria-hidden="true" /></button>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ubicación</p><p className="mt-1 text-sm font-semibold text-slate-900">{location?.name}</p><p className="mt-1 text-xs text-slate-500">Este ajuste modifica únicamente el stock de este punto de venta.</p></div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Unidades disponibles<input name="posStock" type="text" inputMode="numeric" value={stock} onChange={(event) => { setStock(event.target.value); setValidationError(""); }} className={`min-h-11 rounded-full border bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 ${message ? "border-red-500" : "border-slate-200"}`} aria-invalid={Boolean(message)} aria-describedby={message ? "pos-stock-error" : "pos-stock-help"} required /><span id="pos-stock-help" className="text-xs font-normal text-slate-500">Usa un número entero entre 0 y {MAX_STOCK}.</span></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Motivo del ajuste<textarea name="reason" maxLength={300} rows={3} value={reason} onChange={(event) => { setReason(event.target.value); setValidationError(""); }} className={`rounded-2xl border bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 ${message ? "border-red-500" : "border-slate-200"}`} aria-invalid={Boolean(message)} aria-describedby={message ? "pos-stock-error" : undefined} required /><span className="text-xs font-normal text-slate-500">{reason.length}/300 caracteres.</span></label>
          {message ? <p id="pos-stock-error" className="text-sm text-red-600" role="alert" aria-live="assertive">{message}</p> : null}
          <div className="border-t border-slate-100 pt-4"><AdminModalActions onCancel={onClose} primaryLabel={isSaving ? "Guardando..." : "Guardar stock"} primaryDisabled={isSaving} /></div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
