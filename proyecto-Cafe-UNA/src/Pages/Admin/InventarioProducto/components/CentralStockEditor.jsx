import { useEffect, useRef, useState } from "react";

import { Package } from "lucide-react";

import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalFooter,
  AdminModalHeader,
} from "../../../../Components/Admin/ui/AdminModal";
import { NumericInput } from "../../../../Components/NumericInput/NumericInput";
import { sanitizeUserFacingError } from "../../../../lib/formLimits";
import { ProductLocationStockPanel } from "./ProductLocationStockPanel";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";

const MAX_STOCK = 2147483647;

function initialValue(stockRecord) {
  return stockRecord?.confidence === "known" ? String(stockRecord.stock) : "";
}

export function CentralStockEditor({
  open,
  product,
  stockRecord,
  onSave,
  onClose,
  isSaving = false,
  error = "",
}) {
  const [value, setValue] = useState(() => initialValue(stockRecord));
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const submitGuard = useRef(false);
  const [syncedStock, setSyncedStock] = useState(() => initialValue(stockRecord));
  const tTitulo = useTraducir("Stock de Bodega Central");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarStock = useTraducir("Guardar stock");
  const tProducto = useTraducir("Producto");

  // Re-sync with a new record while open (adjust state during render)
  const nextStock = initialValue(stockRecord);
  if (open && nextStock !== syncedStock) {
    setSyncedStock(nextStock);
    setValue(nextStock);
    setValidationError("");
    setSubmitError("");
  }

  useEffect(() => {
    if (!open) submitGuard.current = false;
  }, [open]);

  if (!open) return null;

  const message = validationError || submitError || error;
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitGuard.current || isSaving) return;

    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
      setValidationError(`Ingrese un entero entre 0 y ${MAX_STOCK}.`);
      setSubmitError("");
      window.requestAnimationFrame(() => document.querySelector("[name='stockCentral']")?.focus());
      return;
    }

    submitGuard.current = true;
    setValidationError("");
    setSubmitError("");

    try {
      await onSave(stock);
      setSyncedStock(String(stock));
    } catch (saveError) {
      submitGuard.current = false;
      setSubmitError(sanitizeUserFacingError(saveError?.message || "No se pudo actualizar el stock central."));
    }
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="central-stock-editor-title">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <AdminModalHeader
          icon={Package}
          title={tTitulo}
          titleId="central-stock-editor-title"
          description={product?.nombre || tProducto}
          onClose={onClose}
        />

        <AdminModalBody className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500"><ST>Ubicación</ST></p>
            <p className="mt-1 text-sm font-semibold text-slate-900"><ST>Bodega Central</ST></p>
            <p className="mt-1 text-xs text-slate-500">
              <ST>Este valor no modifica activos ni el stock de los puntos de venta.</ST>
            </p>
          </div>

          {stockRecord?.confidence !== "known" ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">
              <ST>No se pudo confirmar el stock actual. Ingresa el valor correcto para continuar.</ST>
            </p>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>Unidades disponibles</ST>
            <NumericInput
              name="stockCentral"
              value={value}
              disabled={isSaving}
              onChange={(event) => {
                setValue(event.target.value);
                setValidationError("");
                setSubmitError("");
              }}
              className={`min-h-11 w-full rounded-full border bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 disabled:opacity-60 ${message ? "border-red-500" : "border-slate-200"}`}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? "central-stock-error" : undefined}
              required
            />
            <span className="text-xs font-normal text-slate-500"><ST>Usa únicamente números enteros.</ST></span>
          </label>

          {message ? (
            <p id="central-stock-error" className="text-sm text-red-600" role="alert" aria-live="assertive">
              <ST>{message}</ST>
            </p>
          ) : null}

          <ProductLocationStockPanel
            productId={product?.id}
            refreshKey={product?.id || ""}
          />

        </AdminModalBody>
        <AdminModalFooter>
          <AdminModalActions
            variant="coffee"
            onCancel={onClose}
            primaryLabel={isSaving ? tGuardando : tGuardarStock}
            primaryDisabled={isSaving}
          />
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}
