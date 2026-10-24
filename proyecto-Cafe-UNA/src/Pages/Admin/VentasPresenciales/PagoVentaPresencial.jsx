import { CreditCard } from "lucide-react";

import { ST } from "../../../Components/T/ST";
import { UiSelect } from "../../../Components/ui/Select";
import { t } from "../../../lib/t";
import { calcularVuelto, esEfectivo, opcionesMetodoPago } from "../../../lib/pagoPresencial";

const ETIQUETAS_METODO_PAGO = {
  Tarjeta: "Tarjeta de débito / crédito",
  Transferencia: "Transferencia bancaria",
};

export function PagoVentaPresencial({
  metodos,
  metodoPago,
  onMetodoPago,
  total,
  montoRecibido,
  onMontoRecibido,
}) {
  const opciones = opcionesMetodoPago(metodos, ETIQUETAS_METODO_PAGO);
  const efectivo = esEfectivo(metodoPago);
  const pago = efectivo ? calcularVuelto(total, montoRecibido) : null;
  const ingreso = String(montoRecibido ?? "").trim();

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="font-semibold text-slate-700 flex items-center gap-1" htmlFor="pos-metodo-pago">
          <CreditCard className="size-3 text-neutral-900" />
          <ST>Método de Pago</ST>
        </label>
        <UiSelect
          id="pos-metodo-pago"
          ariaLabel={t("Método de Pago")}
          value={metodoPago}
          onChange={onMetodoPago}
          options={opciones}
          disabled={opciones.length === 0}
          className="w-full"
        />
      </div>

      {efectivo ? (
        <div className="space-y-1">
          <label className="font-semibold text-slate-700" htmlFor="pos-monto-recibido">
            <ST>Monto recibido</ST>
          </label>
          <input
            id="pos-monto-recibido"
            type="text"
            inputMode="decimal"
            value={montoRecibido}
            onChange={(event) => onMontoRecibido(event.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0"
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-black focus:bg-white"
          />
          {ingreso && pago && !pago.suficiente ? (
            <p className="text-[11px] font-medium text-rose-700" role="alert">
              <ST>El monto recibido es menor que el total.</ST>
            </p>
          ) : null}
          {pago?.suficiente ? (
            <p className="flex items-baseline justify-between text-[11px] text-slate-600">
              <ST>Vuelto</ST>
              <span className="font-semibold text-slate-900">₡{pago.vuelto.toLocaleString("es-CR")}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
