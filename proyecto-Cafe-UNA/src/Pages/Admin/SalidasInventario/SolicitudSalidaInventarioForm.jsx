import { useState } from "react";

import { SelectFiltro } from "../../../Components/ui/SelectFiltro";
import { nuevoUid } from "../../../lib/clientUid";

const inputClass =
  "box-border block h-[var(--control-height)] w-full min-w-0 max-w-full rounded-xl border border-slate-300 bg-white px-3 text-[length:var(--text-body)] text-slate-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass =
  "flex min-w-0 max-w-full flex-col gap-1.5 overflow-hidden text-[length:var(--text-body)] font-semibold text-slate-800 dark:text-slate-100";

function fechaLocalHoy() {
  const hoy = new Date();
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function stockDisponible(producto) {
  const central = producto?.centralStock;
  if (central?.confidence === "known") {
    const disponible = Number(central.available ?? central.disponible);
    if (Number.isInteger(disponible) && disponible >= 0) return disponible;
    const stock = Number(central.stock);
    const reservado = Number(central.reserved ?? central.stockReservado ?? 0);
    return Number.isInteger(stock) && Number.isInteger(reservado)
      ? Math.max(0, stock - reservado)
      : null;
  }
  const disponible = Number(producto?.stockDisponible ?? producto?.disponible);
  if (Number.isInteger(disponible) && disponible >= 0) return disponible;
  const stock = Number(producto?.stockCentral ?? producto?.stock);
  const reservado = Number(producto?.stockReservado ?? 0);
  return Number.isInteger(stock) && Number.isInteger(reservado)
    ? Math.max(0, stock - reservado)
    : null;
}

function nuevoItem() {
  return { uid: nuevoUid(), productoId: "", cantidad: "" };
}

const OPCIONES_TIPO = [
  { value: "donacion", label: "Donación" },
  { value: "regalia", label: "Regalía" },
];

export function SolicitudSalidaInventarioForm({ productos = [], onSubmit, isSubmitting = false }) {
  const [tipo, setTipo] = useState("donacion");
  const [fechaSalida, setFechaSalida] = useState(fechaLocalHoy);
  const [destinatario, setDestinatario] = useState("");
  const [responsable, setResponsable] = useState("");
  const [items, setItems] = useState([nuevoItem()]);
  const [error, setError] = useState("");

  const updateItem = (index, changes) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...changes } : item
    )));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!fechaSalida || !destinatario.trim() || !responsable.trim()) {
      setError("Completá la fecha, el destinatario y la persona responsable.");
      return;
    }

    const normalizedItems = [];
    const productIds = new Set();
    for (const item of items) {
      const product = productos.find((candidate) => String(candidate.id) === item.productoId);
      const cantidad = Number(item.cantidad);
      const disponible = product ? stockDisponible(product) : null;
      if (!product || !Number.isInteger(cantidad) || cantidad <= 0) {
        setError("Seleccioná un producto e ingresá una cantidad entera mayor que cero para cada artículo.");
        return;
      }
      if (productIds.has(item.productoId)) {
        setError("Cada producto debe aparecer una sola vez en la solicitud.");
        return;
      }
      if (disponible !== null && cantidad > disponible) {
        setError(`La cantidad de ${product.nombre} supera el stock disponible (${disponible}).`);
        return;
      }
      productIds.add(item.productoId);
      normalizedItems.push({ productoId: item.productoId, cantidad });
    }

    try {
      await onSubmit?.({
        tipo,
        fechaSalida,
        destinatario: destinatario.trim(),
        responsable: responsable.trim(),
        items: normalizedItems,
      });
      setFechaSalida(fechaLocalHoy());
      setDestinatario("");
      setResponsable("");
      setItems([nuevoItem()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar la solicitud.");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="min-w-0 max-w-full space-y-4 overflow-x-clip">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <label className={labelClass}>
          Tipo de salida
          <SelectFiltro
            aria-label="Tipo de salida"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            options={OPCIONES_TIPO}
            traducirOpciones
          />
        </label>
        <label className={labelClass}>
          Fecha de salida
          <input
            aria-label="Fecha de salida"
            type="date"
            value={fechaSalida}
            onChange={(event) => setFechaSalida(event.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className={labelClass}>
          Destinatario
          <input aria-label="Destinatario" value={destinatario} onChange={(event) => setDestinatario(event.target.value)} className={inputClass} maxLength={200} required />
        </label>
        <label className={labelClass}>
          Responsable
          <input aria-label="Responsable" value={responsable} onChange={(event) => setResponsable(event.target.value)} className={inputClass} maxLength={200} required />
        </label>
      </div>

      <fieldset className="min-w-0 max-w-full space-y-3 overflow-x-clip">
        <legend className="text-[length:var(--text-body)] font-semibold text-slate-900 dark:text-slate-100">Artículos de la solicitud</legend>
        {items.map((item, index) => {
          const selectedIds = new Set(items.filter((_, itemIndex) => itemIndex !== index).map((entry) => entry.productoId));
          const opciones = [
            { value: "", label: "Seleccionar producto…" },
            ...productos
              .filter((product) => !selectedIds.has(String(product.id)) && (stockDisponible(product) === null || stockDisponible(product) > 0))
              .map((product) => ({ value: String(product.id), label: product.nombre })),
          ];
          return (
            <div
              key={item.uid}
              role="group"
              aria-label={`Artículo ${index + 1}`}
              className="grid min-w-0 grid-cols-1 gap-3 overflow-x-clip rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] dark:border-slate-700"
            >
              <label className={labelClass}>
                Producto
                <SelectFiltro
                  aria-label="Producto"
                  value={item.productoId}
                  onChange={(event) => updateItem(index, { productoId: event.target.value })}
                  options={opciones}
                  required
                  traducirOpciones
                />
              </label>
              <label className={labelClass}>
                Cantidad
                <input aria-label="Cantidad" type="number" min="1" step="1" inputMode="numeric" value={item.cantidad} onChange={(event) => updateItem(index, { cantidad: event.target.value })} className={inputClass} required />
              </label>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="inline-flex h-[var(--control-height)] w-full items-center justify-center rounded-lg px-3 text-[length:var(--text-body)] font-semibold text-rose-700 hover:bg-rose-50 sm:w-auto dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  Quitar
                </button>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setItems((current) => [...current, nuevoItem()])}
          className="inline-flex h-[var(--control-height)] w-full items-center justify-center rounded-full border border-slate-300 px-4 text-[length:var(--text-body)] font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 sm:w-auto dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          Agregar artículo
        </button>
      </fieldset>

      {error ? <p role="alert" className="break-words rounded-lg bg-rose-50 p-3 text-[length:var(--text-body)] text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-[var(--control-height)] w-full items-center justify-center rounded-full bg-amber-900 px-6 text-[length:var(--text-body)] font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Enviando solicitud…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
