import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Plus, Save, Trash2, X } from "lucide-react";

import { AdminModal, AdminModalBody, AdminModalFooter, AdminModalHeader, adminBtnCancel } from "./AdminModal";
import { SelectorIcono } from "./SelectorIcono";
import { NumericInput } from "../../NumericInput/NumericInput";
import { SelectFiltro } from "../../ui/SelectFiltro";
import { ST } from "../../T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { TIPO_CATEGORIA_PRODUCTO } from "../../../lib/categorias";
import { sanitizeUserFacingError } from "../../../lib/formLimits";
import { iconoDeCategoriaProducto } from "../../../lib/iconosCatalogo";
import { t } from "../../../lib/t";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  obtenerCategorias,
} from "../../../services/categoriasService";
import {
  actualizarItemCatalogo,
  crearItemCatalogo,
  eliminarItemCatalogo,
  listarCatalogo,
  TIPOS_CATALOGO,
} from "../../../services/catalogosService";

const btnPrimario =
  "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

const btnIcono =
  "inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

export const claseInputCatalogo =
  "h-[var(--control-height)] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 text-[length:var(--text-body)] text-slate-900 focus:border-slate-500 focus:outline-none";

const claseInput = claseInputCatalogo;

const claseControlBase =
  "h-[var(--control-height)] rounded-2xl border border-slate-200 bg-white px-4 text-[length:var(--text-body)] text-slate-900 focus:border-slate-500 focus:outline-none";
function separarPresentacion(texto, unidades = []) {
  const m = String(texto || "").trim().match(/^(\d+(?:[.,]\d+)?)\s*(\S.*)?$/);
  if (!m) return null;
  const escrita = (m[2] || "").trim();
  const unidad = escrita
    ? unidades.find((u) => u.toLowerCase() === escrita.toLowerCase()) || escrita
    : unidades[0] || "";
  return { cantidad: m[1].replace(",", "."), unidad };
}

function unirPresentacion(cantidad, unidad) {
  const limpio = String(cantidad ?? "").trim().replace(",", ".");
  return limpio ? `${limpio} ${unidad || ""}`.trim() : "";
}

function normalizarOpcion(texto, presentacion, unidades) {
  const partes = presentacion ? separarPresentacion(texto, unidades) : null;
  const base = partes ? unirPresentacion(Number(partes.cantidad), partes.unidad) : String(texto || "").trim();
  return base.toLowerCase();
}

function CamposPresentacion({ cantidad, unidad, unidades = [], onCantidad, onUnidad, onEnter, placeholder, disabled }) {
  const opciones = unidad && !unidades.includes(unidad) ? [...unidades, unidad] : unidades;
  const tCantidad = useTraducir("Cantidad");
  const tUnidad = useTraducir("Unidad");
  const tPlaceholder = useTraducir(placeholder || "Cantidad");

  return (
    <div className="flex w-full min-w-0 flex-1 gap-2">
      <NumericInput
        decimal
        maxLength={8}
        className={`${claseControlBase} min-w-0 flex-1`}
        value={cantidad}
        disabled={disabled}
        onChange={(e) => onCantidad(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={tPlaceholder}
        aria-label={tCantidad}
      />
      <div className="w-28 flex-none">
        <SelectFiltro
          value={unidad}
          disabled={disabled}
          onChange={(e) => onUnidad(e.target.value)}
          aria-label={tUnidad}
          options={opciones.map((u) => ({ value: u, label: u }))}
        />
      </div>
    </div>
  );
}

function FilaEditable({
  item,
  sangria = false,
  conIcono = false,
  presentacion = false,
  unidades = [],
  detalle,
  onGuardar,
  onEliminar,
  onIcono,
}) {
  const partes = presentacion ? separarPresentacion(item.nombre, unidades) : null;
  const [nombre, setNombre] = useState(item.nombre);
  const [cantidad, setCantidad] = useState(partes?.cantidad ?? "");
  const [unidad, setUnidad] = useState(partes?.unidad ?? unidades[0] ?? "");
  const [ocupado, setOcupado] = useState(false);
  const tGuardar = useTraducir("Guardar nombre");
  const tEliminar = useTraducir("Eliminar");
  const valor = partes ? unirPresentacion(cantidad, unidad) : nombre.trim();
  const original = partes ? unirPresentacion(partes.cantidad, partes.unidad) : item.nombre;
  const cambiado = valor && valor !== original;

  const correr = async (accion) => {
    setOcupado(true);
    try {
      await accion();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <li className={`flex items-center gap-2 py-2 ${sangria ? "pl-8 sm:pl-12" : ""}`}>
      {conIcono ? (
        <SelectorIcono
          valor={item.icono}
          IconoActual={iconoDeCategoriaProducto(item.nombre, item.icono)}
          etiquetaAuto="Automático según el nombre"
          disabled={ocupado}
          onElegir={(clave) => correr(() => onIcono(item, clave))}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        {partes ? (
          <CamposPresentacion
            cantidad={cantidad}
            unidad={unidad}
            unidades={unidades}
            onCantidad={setCantidad}
            onUnidad={setUnidad}
            onEnter={() => {
              if (cambiado) correr(() => onGuardar(item, valor));
            }}
          />
        ) : (
          <input
            className={claseInput}
            value={nombre}
            maxLength={item.maxLength || 120}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && cambiado) correr(() => onGuardar(item, valor));
            }}
            aria-label={item.nombre}
          />
        )}
        {detalle ? (
          <p className="mt-1 px-1 text-[length:var(--text-body)] text-slate-500">
            <ST>{detalle}</ST>
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className={btnIcono}
        disabled={!cambiado || ocupado}
        onClick={() => correr(() => onGuardar(item, valor))}
        aria-label={tGuardar}
        title={tGuardar}
      >
        <Save className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={`${btnIcono} hover:border-red-200 hover:text-red-600`}
        disabled={ocupado}
        onClick={() => correr(() => onEliminar(item))}
        aria-label={tEliminar}
        title={tEliminar}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

function FormAgregar({ placeholder, onAgregar, sinBorde = false, presentacion = false, unidades = [] }) {
  const [valor, setValor] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState(unidades[0] ?? "");
  const [ocupado, setOcupado] = useState(false);
  const tPlaceholder = useTraducir(placeholder || "Nombre de la nueva opción");
  const tAgregar = useTraducir("Agregar");
  const limpio = presentacion ? unirPresentacion(cantidad, unidad) : valor.trim();

  const enviar = async (e) => {
    e.preventDefault();
    if (!limpio) return;
    setOcupado(true);
    try {
      const ok = await onAgregar(limpio);
      if (ok !== false) {
        setValor("");
        setCantidad("");
      }
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      className={`flex flex-col gap-2 sm:flex-row ${sinBorde ? "" : "border-t border-slate-100 pt-4"}`}
    >
      {presentacion ? (
        <CamposPresentacion
          cantidad={cantidad}
          unidad={unidad}
          unidades={unidades}
          onCantidad={setCantidad}
          onUnidad={setUnidad}
          placeholder={placeholder}
          disabled={ocupado}
        />
      ) : (
        <input
          className={claseInput}
          value={valor}
          maxLength={120}
          onChange={(e) => setValor(e.target.value)}
          placeholder={tPlaceholder}
          aria-label={tPlaceholder}
        />
      )}
      <button type="submit" className={btnPrimario} disabled={!limpio || ocupado}>
        <Plus className="size-4" aria-hidden />
        {tAgregar}
      </button>
    </form>
  );
}

function textoUsos(usos) {
  if (!usos) return "";
  return usos === 1 ? "1 producto la usa" : `${usos} productos la usan`;
}

export function PanelCategorias({ onMessage, onError }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const tNuevaSub = useTraducir("La nueva categoría va dentro de:");

  const cargar = useCallback(
    () =>
      obtenerCategorias(TIPO_CATEGORIA_PRODUCTO)
        .then(setLista)
        .catch((err) => {
          onError(sanitizeUserFacingError(err?.message || "No se pudieron cargar las categorías."));
        })
        .finally(() => setCargando(false)),
    [onError],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const raices = useMemo(() => lista.filter((c) => !c.padre), [lista]);
  const hijasDe = useCallback(
    (nombre) => lista.filter((c) => c.padre.toLowerCase() === nombre.toLowerCase()),
    [lista],
  );
  const [padreNueva, setPadreNueva] = useState("");

  const ejecutar = async (accion, mensaje, tono = "ok") => {
    try {
      await accion();
      await cargar();
      onMessage(mensaje, tono);
      return true;
    } catch (err) {
      onError(sanitizeUserFacingError(err?.message || "No se pudo guardar el cambio."));
      return false;
    }
  };

  const props = {
    conIcono: false,
    onGuardar: (item, nombre) =>
      ejecutar(() => actualizarCategoria(item.id, { nombre }), "Categoría renombrada."),
    onEliminar: (item) => {
      if (!window.confirm(t(`¿Eliminar la categoría "${item.nombre}"?`))) return Promise.resolve();
      return ejecutar(() => eliminarCategoria(item.id), "Categoría eliminada.", "eliminado");
    },
    onIcono: (item, icono) =>
      ejecutar(() => actualizarCategoria(item.id, { icono }), "Ícono actualizado."),
  };

  if (cargando) {
    return (
      <p className="text-[length:var(--text-body)] text-slate-500">
        <ST>Cargando categorías...</ST>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {raices.length === 0 ? (
        <p className="text-[length:var(--text-body)] text-slate-500">
          <ST>Todavía no hay categorías de productos.</ST>
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {raices.map((raiz) => (
            <li key={raiz.id} className="py-1">
              <ul>
                <FilaEditable
                  key={`${raiz.id}-${raiz.nombre}`}
                  item={{ ...raiz, maxLength: 80 }}
                  {...props}
                  conIcono
                  detalle={textoUsos(raiz.usos)}
                />
                {hijasDe(raiz.nombre).map((hija) => (
                  <FilaEditable
                    key={`${hija.id}-${hija.nombre}`}
                    item={{ ...hija, maxLength: 80 }}
                    sangria
                    {...props}
                    detalle={textoUsos(hija.usos)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {raices.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[length:var(--text-body)] text-slate-600" role="group" aria-label={tNuevaSub}>
          {tNuevaSub}
          <span className="flex flex-wrap gap-1.5">
            {[{ id: "", nombre: "" }, ...raices].map((raiz) => (
              <button
                key={raiz.id || "raiz"}
                type="button"
                onClick={() => setPadreNueva(raiz.nombre)}
                className={`min-h-[var(--control-height)] rounded-full border px-4 text-[length:var(--text-body)] ${
                  padreNueva === raiz.nombre
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {raiz.nombre ? raiz.nombre : <ST>Ninguna (categoría principal)</ST>}
              </button>
            ))}
          </span>
        </div>
      ) : null}
      <FormAgregar
        sinBorde={raices.length > 0}
        placeholder={padreNueva ? "Nombre de la nueva subcategoría" : "Nombre de la nueva categoría"}
        onAgregar={(nombre) =>
          ejecutar(() => crearCategoria({ nombre, tipo: TIPO_CATEGORIA_PRODUCTO, padre: padreNueva }), "Categoría agregada.")
        }
      />
    </div>
  );
}

export function PanelLista({ tipo, placeholder, presentacion = false, onMessage, onError }) {
  const [lista, setLista] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(
    () =>
      Promise.all([
        listarCatalogo(tipo, { forzar: true }),
        presentacion ? listarCatalogo(TIPOS_CATALOGO.unidadPresentacion, { forzar: true }) : [],
      ])
        .then(([items, unidadesCatalogo]) => {
          setLista(items);
          setUnidades(unidadesCatalogo.map((u) => u.nombre).filter(Boolean));
        })
        .catch((err) => {
          onError(sanitizeUserFacingError(err?.message || "No se pudo cargar la lista."));
        })
        .finally(() => setCargando(false)),
    [tipo, presentacion, onError],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ejecutar = async (accion, mensaje, tono = "ok") => {
    try {
      await accion();
      await cargar();
      onMessage(mensaje, tono);
      return true;
    } catch (err) {
      onError(sanitizeUserFacingError(err?.message || "No se pudo guardar el cambio."));
      return false;
    }
  };

  const repetida = (nombre, idPropio) =>
    lista.some(
      (i) =>
        i.id !== idPropio &&
        normalizarOpcion(i.nombre, presentacion, unidades) === normalizarOpcion(nombre, presentacion, unidades),
    );

  const avisarRepetida = () => {
    onError("Esa opción ya existe.");
    return false;
  };

  if (cargando) {
    return (
      <p className="text-[length:var(--text-body)] text-slate-500">
        <ST>Cargando...</ST>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lista.length === 0 ? (
        <p className="text-[length:var(--text-body)] text-slate-500">
          <ST>Todavía no hay opciones. Agregá la primera.</ST>
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {lista.map((item) => (
            <FilaEditable
              key={`${item.id}-${item.nombre}`}
              item={item}
              presentacion={presentacion}
              unidades={unidades}
              onGuardar={(it, nombre) =>
                repetida(nombre, it.id)
                  ? avisarRepetida()
                  : ejecutar(() => actualizarItemCatalogo(tipo, it.id, { nombre }), "Opción actualizada.")
              }
              onEliminar={(it) => {
                if (!window.confirm(t(`¿Eliminar "${it.nombre}"?`))) return Promise.resolve();
                return ejecutar(() => eliminarItemCatalogo(tipo, it.id), "Opción eliminada.", "eliminado");
              }}
            />
          ))}
        </ul>
      )}
      <FormAgregar
        placeholder={placeholder}
        presentacion={presentacion}
        unidades={unidades}
        onAgregar={(nombre) =>
          repetida(nombre) ? avisarRepetida() : ejecutar(() => crearItemCatalogo(tipo, { nombre }), "Opción agregada.")
        }
      />
    </div>
  );
}


/** Modal con un panel de catálogo (categorías de productos o una lista simple). */
export function ModalCatalogo({ open, onClose, titulo, ayuda, tipo, placeholder, presentacion = false }) {
  const [mensaje, setMensaje] = useState("");
  const [tonoMensaje, setTonoMensaje] = useState("ok");
  const [error, setError] = useState("");
  const tTitulo = useTraducir(titulo);
  const tAyuda = useTraducir(ayuda || "");
  const tCerrar = useTraducir("Cerrar");
  const onMessage = useCallback((texto, tono = "ok") => {
    setError("");
    setMensaje(texto);
    setTonoMensaje(tono);
  }, []);
  const onError = useCallback((texto) => {
    setMensaje("");
    setError(texto);
  }, []);

  if (!open) return null;

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-3xl" labelledBy="modal-catalogo-titulo">
      <AdminModalHeader>
        <div className="flex min-w-0 items-center gap-2.5">
          <ListChecks className="size-6 shrink-0 text-slate-700" strokeWidth={1.75} aria-hidden="true" />
          <h2 id="modal-catalogo-titulo" className="truncate text-[length:var(--text-subtitle)] font-bold text-slate-950">
            {tTitulo}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={tCerrar}
        >
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody className="space-y-4">
        {ayuda ? <p className="text-[length:var(--text-body)] text-slate-500">{tAyuda}</p> : null}
        {mensaje ? (
          <p
            className={`text-[length:var(--text-body)] font-semibold ${tonoMensaje === "eliminado" ? "text-red-600" : "text-emerald-700"}`}
            role="status"
          >
            <ST>{mensaje}</ST>
          </p>
        ) : null}
        {error ? (
          <p className="text-[length:var(--text-body)] font-semibold text-red-600" role="alert">
            <ST>{error}</ST>
          </p>
        ) : null}
        {tipo === "categorias" ? (
          <PanelCategorias onMessage={onMessage} onError={onError} />
        ) : (
          <PanelLista tipo={tipo} placeholder={placeholder} presentacion={presentacion} onMessage={onMessage} onError={onError} />
        )}
      </AdminModalBody>
      <AdminModalFooter>
        <button type="button" onClick={onClose} className={adminBtnCancel}>
          {tCerrar}
        </button>
      </AdminModalFooter>
    </AdminModal>
  );
}