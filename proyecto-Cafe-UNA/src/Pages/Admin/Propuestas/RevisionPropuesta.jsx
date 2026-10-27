import { useState } from "react";
import { History, Lock, Save } from "lucide-react";

import {
  adminBtnPrimary,
  adminBtnVoluntariadoCancel,
} from "../../../Components/Admin/ui/AdminModal";
import CampoUbicacionMapa from "../../../Components/Productores/CampoUbicacionMapa";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { ST } from "../../../Components/T/ST";
import { SelectFiltro } from "../../../Components/ui/SelectFiltro";
import { useTraducir } from "../../../hooks/useTraducir";
import { limpiarCorreo } from "../../../lib/correo";
import {
  cantonesDeProvincia,
  distritosDeCanton,
  PROVINCIAS_CR,
} from "../../../lib/costaRicaDivisiones";
import {
  DESCRIPCION_MAX,
  DIRECCION_MAX,
  NOMBRE_MAX,
  NOTA_INTERNA_MAX,
  URL_MAX,
  formatearFechaPropuesta,
  validarEdicionPropuesta,
} from "../../../lib/propuestaProductor";
import {
  actualizarPropuestaAdmin,
  guardarNotaInternaPropuesta,
} from "../../../services/propuestasProductoresService";

const inputCls =
  "min-h-[var(--control-height)] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";
const textareaCls =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

function telefonoEditable(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function whatsappEditable(valor) {
  const texto = String(valor || "").trim();
  const match = texto.match(/wa\.me\/(\d+)/i);
  return match ? `+${match[1]}` : texto;
}

function formDesde(propuesta) {
  return {
    nombre: propuesta.nombre || "",
    descripcion: propuesta.descripcion || "",
    provincia: propuesta.provincia || "",
    canton: propuesta.canton || "",
    distrito: propuesta.distrito || "",
    direccion: propuesta.senas || propuesta.direccion || "",
    enlaceUbicacion: propuesta.enlaceUbicacion || "",
    latitud:
      propuesta.latitud != null && Number.isFinite(Number(propuesta.latitud))
        ? String(propuesta.latitud)
        : "",
    longitud:
      propuesta.longitud != null && Number.isFinite(Number(propuesta.longitud))
        ? String(propuesta.longitud)
        : "",
    facebook: propuesta.facebook || "",
    instagram: propuesta.instagram || "",
    whatsapp: whatsappEditable(propuesta.whatsapp),
    sitioWeb: propuesta.sitioWeb || "",
    correo: propuesta.correo || "",
    telefono: telefonoEditable(propuesta.telefono),
  };
}

function CampoForm({ id, label, error, children, ancho = false }) {
  return (
    <div className={`grid gap-1.5 ${ancho ? "md:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-[length:var(--text-body)] font-medium text-slate-700">
        <ST>{label}</ST>
      </label>
      {children}
      {error ? (
        <span className="text-[length:var(--text-body)] text-rose-700"><ST>{error}</ST></span>
      ) : null}
    </div>
  );
}

/** Corrige los datos de la propuesta antes de aprobarla. */
export function EditarPropuestaForm({ propuesta, onGuardado, onCancelar }) {
  const [form, setForm] = useState(() => formDesde(propuesta));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const tSeleccione = useTraducir("Seleccione una opción");

  const cambiar = (campo, valor) => {
    setForm((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === "provincia") {
        siguiente.canton = "";
        siguiente.distrito = "";
      }
      if (campo === "canton") siguiente.distrito = "";
      if (campo === "enlaceUbicacion") {
        siguiente.latitud = "";
        siguiente.longitud = "";
      }
      return siguiente;
    });
    setErrores((actual) => ({ ...actual, [campo]: "" }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    const encontrados = validarEdicionPropuesta(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setGuardando(true);
    setErrorGeneral("");
    try {
      const actualizada = await actualizarPropuestaAdmin(propuesta.id, form);
      onGuardado(actualizada);
    } catch (err) {
      setErrorGeneral(err?.message || "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const texto = (campo, label, extra = {}) => (
    <CampoForm id={`edit-${campo}`} label={label} error={errores[campo]} ancho={extra.ancho}>
      <input
        id={`edit-${campo}`}
        type={extra.type || "text"}
        value={form[campo]}
        maxLength={extra.maxLength || URL_MAX}
        placeholder={extra.placeholder}
        onChange={(event) =>
          cambiar(campo, extra.type === "email" ? limpiarCorreo(event.target.value) : event.target.value)
        }
        className={inputCls}
      />
    </CampoForm>
  );

  return (
    <form onSubmit={guardar} noValidate className="space-y-6">
      <p className="rounded-2xl bg-amber-50 px-3 py-2 text-[length:var(--text-body)] text-amber-900">
        <ST>Corregí los datos que tengan errores. El productor verá la versión corregida cuando se publique.</ST>
      </p>

      <section className="grid gap-4 md:grid-cols-2">
        {texto("nombre", "Nombre del emprendimiento", { maxLength: NOMBRE_MAX, ancho: true })}
        <CampoForm id="edit-descripcion" label="Descripción" error={errores.descripcion} ancho>
          <textarea
            id="edit-descripcion"
            rows={5}
            maxLength={DESCRIPCION_MAX}
            value={form.descripcion}
            onChange={(event) => cambiar("descripcion", event.target.value)}
            className={textareaCls}
          />
        </CampoForm>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <CampoForm id="edit-provincia" label="Provincia" error={errores.provincia}>
          <SelectFiltro
            id="edit-provincia"
            value={form.provincia}
            onChange={(event) => cambiar("provincia", event.target.value)}
          >
            <option value="">{tSeleccione}</option>
            {PROVINCIAS_CR.map((provincia) => (
              <option key={provincia} value={provincia}>{provincia}</option>
            ))}
          </SelectFiltro>
        </CampoForm>
        <CampoForm id="edit-canton" label="Cantón" error={errores.canton}>
          <SelectFiltro
            id="edit-canton"
            value={form.canton}
            disabled={!form.provincia}
            onChange={(event) => cambiar("canton", event.target.value)}
          >
            <option value="">{tSeleccione}</option>
            {cantonesDeProvincia(form.provincia).map((canton) => (
              <option key={canton} value={canton}>{canton}</option>
            ))}
          </SelectFiltro>
        </CampoForm>
        <CampoForm id="edit-distrito" label="Distrito" error={errores.distrito}>
          <SelectFiltro
            id="edit-distrito"
            value={form.distrito}
            disabled={!form.canton}
            onChange={(event) => cambiar("distrito", event.target.value)}
          >
            <option value="">{tSeleccione}</option>
            {distritosDeCanton(form.provincia, form.canton).map((distrito) => (
              <option key={distrito} value={distrito}>{distrito}</option>
            ))}
          </SelectFiltro>
        </CampoForm>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <CampoForm id="edit-direccion" label="Dirección o señas adicionales" error={errores.direccion} ancho>
          <textarea
            id="edit-direccion"
            rows={2}
            maxLength={DIRECCION_MAX}
            value={form.direccion}
            onChange={(event) => cambiar("direccion", event.target.value)}
            className={textareaCls}
          />
        </CampoForm>
        {texto("enlaceUbicacion", "Enlace de Google Maps o Waze", {
          type: "url",
          ancho: true,
          placeholder: "https://maps.app.goo.gl/...",
        })}
        <div className="md:col-span-2">
          <CampoUbicacionMapa
            enlaceUbicacion={form.enlaceUbicacion}
            latitud={form.latitud}
            longitud={form.longitud}
            onChangeCoords={({ latitud, longitud }) => {
              setForm((actual) => ({ ...actual, latitud, longitud }));
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {texto("facebook", "Facebook", { type: "url", placeholder: "https://facebook.com/..." })}
        {texto("instagram", "Instagram", { type: "url", placeholder: "https://instagram.com/..." })}
        {texto("whatsapp", "WhatsApp", { placeholder: "+506 8888 8888", maxLength: 20 })}
        {texto("sitioWeb", "Sitio web", { type: "url", placeholder: "https://..." })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {texto("correo", "Correo electrónico", { type: "email", maxLength: 200 })}
        <CampoForm id="edit-telefono" label="Teléfono" error={errores.telefono}>
          <NumericInput
            id="edit-telefono"
            name="telefono"
            maxLength={15}
            value={form.telefono}
            onChange={(event) => cambiar("telefono", event.target.value)}
            className={inputCls}
          />
        </CampoForm>
      </section>

      {errorGeneral ? (
        <p className="text-[length:var(--text-body)] text-rose-700" role="alert"><ST>{errorGeneral}</ST></p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={adminBtnPrimary} disabled={guardando}>
          <Save className="mr-1.5 size-4" aria-hidden="true" />
          {guardando ? <ST>Guardando...</ST> : <ST>Guardar cambios</ST>}
        </button>
        <button type="button" className={adminBtnVoluntariadoCancel} disabled={guardando} onClick={onCancelar}>
          <ST>Cancelar</ST>
        </button>
      </div>
    </form>
  );
}

/** Nota visible solo para administradores; nunca se envía al productor. */
export function NotaInternaPropuesta({ propuesta, onGuardado }) {
  const [nota, setNota] = useState(propuesta.notaInterna || "");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const sinCambios = nota.trim() === String(propuesta.notaInterna || "").trim();

  const guardar = async () => {
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      const actualizada = await guardarNotaInternaPropuesta(propuesta.id, nota.trim());
      onGuardado(actualizada);
      setMensaje("Nota interna guardada.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar la nota interna.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="inline-flex items-center gap-2 text-[length:var(--text-body)] font-bold text-slate-800">
        <Lock className="size-4" aria-hidden="true" />
        <ST>Nota interna (solo administradores)</ST>
      </h4>
      <textarea
        rows={3}
        maxLength={NOTA_INTERNA_MAX}
        value={nota}
        onChange={(event) => {
          setNota(event.target.value);
          setMensaje("");
        }}
        aria-label="Nota interna"
        placeholder="Por ejemplo: se llamó al productor para confirmar la dirección."
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[length:var(--text-body)] text-slate-900 outline-none focus:border-slate-400"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={adminBtnPrimary}
          disabled={guardando || sinCambios}
          onClick={guardar}
        >
          {guardando ? <ST>Guardando...</ST> : <ST>Guardar nota</ST>}
        </button>
        {mensaje ? <span className="text-[length:var(--text-body)] text-emerald-700"><ST>{mensaje}</ST></span> : null}
        {error ? <span className="text-[length:var(--text-body)] text-rose-700"><ST>{error}</ST></span> : null}
      </div>
    </section>
  );
}

function textoAccion(item) {
  if (item.accion === "estado") {
    return item.estadoAnterior
      ? `Cambió el estado de ${item.estadoAnterior} a ${item.estadoNuevo}`
      : `Cambió el estado a ${item.estadoNuevo}`;
  }
  if (item.accion === "edicion") return "Corrigió datos de la propuesta";
  return "Nota interna";
}

export function HistorialPropuesta({ historial = [] }) {
  if (!historial.length) return null;
  return (
    <section className="mt-6 space-y-3 border-t border-slate-100 pt-6">
      <h4 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <History className="size-4" aria-hidden="true" />
        <ST>Historial de revisión</ST>
      </h4>
      <ol className="space-y-3">
        {historial.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[length:var(--text-body)] font-semibold text-slate-900">
              <ST>{textoAccion(item)}</ST>
            </p>
            <p className="text-[length:var(--text-body)] text-slate-500">
              {formatearFechaPropuesta(item.fecha)}
              {item.adminNombre ? ` · ${item.adminNombre}` : ""}
            </p>
            {item.comentario ? (
              <p className="mt-1 whitespace-pre-wrap text-[length:var(--text-body)] text-slate-700">{item.comentario}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
