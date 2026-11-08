import { useState } from "react";
import { Package } from "lucide-react";

import { AdminModal, AdminModalActions, AdminModalBody, AdminModalFooter, AdminModalHeader } from "../../../../Components/Admin/ui/AdminModal";
import { ContadorPalabras } from "../../../../Components/Admin/ui/CampoLimitePalabras";
import { NumericInput } from "../../../../Components/NumericInput/NumericInput";
import {
  contarPalabras,
  conLimitePalabras,
  MAX_PALABRAS_MOTIVO,
} from "../../../../lib/formLimits";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { asegurarCamposEnEspanol } from "../../../../lib/traducir";

const MAX_STOCK = 2147483647;
const CAMPOS_TEXTO = ["motivo"];

export function PointOfSaleStockEditor({ open, location, product, stockRecord, onSave, onClose, isSaving = false, error = "" }) {
  const tTitulo = useTraducir("Editar stock del punto");
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
    if (!normalizedReason || contarPalabras(normalizedReason) > MAX_PALABRAS_MOTIVO) {
      setValidationError(`El motivo es obligatorio (máx. ${MAX_PALABRAS_MOTIVO} palabras).`);
      return;
    }
    setValidationError("");
    const paraGuardar = await asegurarCamposEnEspanol(
      { motivo: normalizedReason },
      CAMPOS_TEXTO,
    );
    await onSave(parsedStock, paraGuardar.motivo);
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="pos-stock-editor-title">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <AdminModalHeader
          icon={Package}
          title={tTitulo}
          titleId="pos-stock-editor-title"
          description={`${product.nombre} · ${location?.name}`}
          onClose={onClose}
        />
        <AdminModalBody className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">
              <ST>Ubicación</ST>
            </p>
            <p className="mt-1 break-words text-[length:var(--text-body)] font-semibold text-slate-900"><ST>{location?.name}</ST></p>
            <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
              <ST>Este ajuste modifica únicamente el stock de este punto de venta.</ST>
            </p>
          </div>
          <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
            <ST>Unidades disponibles</ST>
            <NumericInput
              name="posStock"
              value={stock}
              onChange={(event) => {
                setStock(event.target.value);
                setValidationError("");
              }}
              className={`box-border h-[var(--control-height)] w-full min-w-0 max-w-full rounded-full border bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 ${message ? "border-red-500" : "border-slate-200"}`}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? "pos-stock-error" : "pos-stock-help"}
              required
            />
            <span id="pos-stock-help" className="text-[length:var(--text-body)] font-normal text-slate-500">
              <ST>{`Usa un número entero entre 0 y ${MAX_STOCK}.`}</ST>
            </span>
          </label>
          <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
            <ST>Motivo del ajuste</ST>
            <textarea
              name="reason"
              rows={3}
              value={reason}
              onChange={conLimitePalabras((event) => {
                setReason(event.target.value);
                setValidationError("");
              }, MAX_PALABRAS_MOTIVO)}
              className={`box-border w-full min-w-0 max-w-full rounded-2xl border bg-slate-50 px-3 py-2.5 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 ${message ? "border-red-500" : "border-slate-200"}`}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? "pos-stock-error" : undefined}
              required
            />
            <ContadorPalabras value={reason} maxPalabras={MAX_PALABRAS_MOTIVO} />
          </label>
          {message ? (
            <p id="pos-stock-error" className="text-[length:var(--text-body)] text-red-600" role="alert" aria-live="assertive">
              <ST>{message}</ST>
            </p>
          ) : null}
        </AdminModalBody>
        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onClose}
            primaryLabel={isSaving ? "Guardando..." : "Guardar stock"}
            primaryDisabled={isSaving}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}
