import { useMemo, useState } from "react";

const MOTIVOS_CANONICOS = ["Venta", "Donación", "Traslado", "Ajuste por merma"];
const MOTIVOS_CON_DESTINATARIO = new Set(["Donación", "Traslado"]);

function stockCentralDe(producto) {
  if (typeof producto?.stockCentral === "number") return producto.stockCentral;
  if (producto?.centralStock) {
    return producto.centralStock.confidence === "known"
      ? producto.centralStock.stock
      : null;
  }
  return producto?.stock;
}

function productoElegible(producto) {
  const stock = Number(stockCentralDe(producto));
  return producto?.estado !== "Deshabilitado" && Number.isInteger(stock) && stock > 0;
}

export function SalidaInventarioForm({
  productos = [],
  motivos = [],
  onSubmit,
  isSubmitting = false,
}) {
  const [productoId, setProductoId] = useState("");
  const [motivoId, setMotivoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [error, setError] = useState("");

  const productosElegibles = useMemo(
    () => productos.filter(productoElegible),
    [productos],
  );
  const motivosDisponibles = useMemo(
    () => MOTIVOS_CANONICOS
      .map((nombre) => motivos.find((motivo) => motivo.nombre === nombre))
      .filter(Boolean),
    [motivos],
  );
  const productoSeleccionado = productosElegibles.find(
    (producto) => String(producto.id) === productoId,
  );
  const motivoSeleccionado = motivosDisponibles.find(
    (motivo) => String(motivo.id) === motivoId,
  );
  const requiereDestinatario = MOTIVOS_CON_DESTINATARIO.has(motivoSeleccionado?.nombre);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!productoSeleccionado) {
      setError("Seleccioná un producto con stock disponible en Bodega Central.");
      return;
    }
    if (!motivoSeleccionado) {
      setError("Seleccioná un motivo de salida válido.");
      return;
    }

    const cantidadNumero = Number(cantidad);
    const stockDisponible = Number(stockCentralDe(productoSeleccionado));
    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }
    if (cantidadNumero > stockDisponible) {
      setError(`La cantidad supera el stock disponible (${stockDisponible}).`);
      return;
    }
    if (requiereDestinatario && !destinatario.trim()) {
      setError("Ingresá el destinatario para este motivo de salida.");
      return;
    }

    const payload = {
      productoId: String(productoSeleccionado.id),
      cantidad: cantidadNumero,
      motivoSalidaId: Number(motivoSeleccionado.id),
      ...(destinatario.trim() ? { destinatario: destinatario.trim() } : {}),
    };

    try {
      await onSubmit?.(payload);
      setProductoId("");
      setMotivoId("");
      setCantidad("");
      setDestinatario("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar la salida.");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="salida-producto" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Producto</label>
          <select
            id="salida-producto"
            name="productoId"
            value={productoId}
            onChange={(event) => setProductoId(event.target.value)}
            required
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Seleccionar…</option>
            {productosElegibles.map((producto) => (
              <option key={producto.id} value={String(producto.id)}>
                {producto.nombre}
              </option>
            ))}
          </select>
          {productosElegibles.length === 0 ? (
            <p className="text-xs text-slate-500">No hay productos habilitados con stock en Bodega Central.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="salida-motivo" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Motivo de salida</label>
          <select
            id="salida-motivo"
            name="motivoSalidaId"
            value={motivoId}
            onChange={(event) => {
              setMotivoId(event.target.value);
              setDestinatario("");
            }}
            required
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Seleccionar…</option>
            {motivosDisponibles.map((motivo) => (
              <option key={motivo.id} value={String(motivo.id)}>{motivo.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="salida-cantidad" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Cantidad</label>
          <input
            id="salida-cantidad"
            name="cantidad"
            type="number"
            min="1"
            max={productoSeleccionado ? stockCentralDe(productoSeleccionado) : undefined}
            step="1"
            inputMode="numeric"
            value={cantidad}
            onChange={(event) => setCantidad(event.target.value)}
            required
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {productoSeleccionado ? (
            <p className="text-xs text-slate-500">Stock disponible: {stockCentralDe(productoSeleccionado)}</p>
          ) : null}
        </div>

        {requiereDestinatario ? (
          <div className="space-y-2">
            <label htmlFor="salida-destinatario" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Destinatario</label>
            <input
              id="salida-destinatario"
              name="destinatario"
              type="text"
              value={destinatario}
              onChange={(event) => setDestinatario(event.target.value)}
              required
              autoComplete="organization"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">{error}</p> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end dark:border-slate-700">
        <button
          type="submit"
          disabled={isSubmitting || productosElegibles.length === 0 || motivosDisponibles.length === 0}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {isSubmitting ? "Registrando…" : "Registrar salida"}
        </button>
      </div>
    </form>
  );
}
