import { useEffect, useRef, useState } from "react";

import { Package, X } from "lucide-react";

import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../../Components/Admin/ui/AdminModal";
import { sanitizeUserFacingError } from "../../../../lib/formLimits";
import { ProductLocationStockPanel } from "./ProductLocationStockPanel";

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
  const lastSyncedStock = useRef(initialValue(stockRecord));

  useEffect(() => {
    if (!open) {
      submitGuard.current = false;
      return;
    }
    const next = initialValue(stockRecord);
    if (next !== lastSyncedStock.current) {
      lastSyncedStock.current = next;
      setValue(next);
      setValidationError("");
      setSubmitError("");
    }
  }, [open, stockRecord]);

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
      lastSyncedStock.current = String(stock);
    } catch (saveError) {
      submitGuard.current = false;
      setSubmitError(sanitizeUserFacingError(saveError?.message || "No se pudo actualizar el stock central."));
    }
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="central-stock-editor-title">
      <AdminModalHeader>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Package className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="central-stock-editor-title" className="truncate text-lg font-semibold text-slate-950">
              Stock de Bodega Central
            </h2>
            <p className="truncate text-sm text-slate-500">{product?.nombre || "Producto"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Cerrar editor de stock central"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </AdminModalHeader>

      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ubicación</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Bodega Central</p>
            <p className="mt-1 text-xs text-slate-500">
              Este valor no modifica activos ni el stock de los puntos de venta.
            </p>
          </div>

          {stockRecord?.confidence !== "known" ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">
              No se pudo confirmar el stock actual. Ingresa el valor correcto para continuar.
            </p>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Unidades disponibles
            <input
              name="stockCentral"
              type="number"
              min="0"
              max={MAX_STOCK}
              step="1"
              inputMode="numeric"
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
            <span className="text-xs font-normal text-slate-500">Usa únicamente números enteros.</span>
          </label>

          {message ? (
            <p id="central-stock-error" className="text-sm text-red-600" role="alert" aria-live="assertive">
              {message}
            </p>
          ) : null}

          <ProductLocationStockPanel
            productId={product?.id}
            refreshKey={product?.id || ""}
          />

          <div className="border-t border-slate-100 pt-4">
            <AdminModalActions
              className="w-full justify-start"
              onCancel={onClose}
              primaryLabel={isSaving ? "Guardando..." : "Guardar stock"}
              primaryDisabled={isSaving}
            />
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
