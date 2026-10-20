import { useEffect, useState } from "react";
import { ImagePlus, Save, Send, X } from "lucide-react";

import {
  AdminModal,
  AdminModalBody,
  AdminModalHeader,
  adminBtnPrimary,
  adminBtnVoluntariadoCancel,
} from "../../Components/Admin/ui/AdminModal";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { ST } from "../../Components/T/ST";
import { SelectFiltro } from "../../Components/ui/SelectFiltro";
import { useTraducir } from "../../hooks/useTraducir";
import { limpiarCorreo } from "../../lib/correo";
import {
  cantonesDeProvincia,
  distritosDeCanton,
  PROVINCIAS_CR,
} from "../../lib/costaRicaDivisiones";
import {
  DESCRIPCION_MAX,
  DIRECCION_MAX,
  NOMBRE_MAX,
  URL_MAX,
  validarEdicionPropuesta,
  validarImagenArchivo,
} from "../../lib/propuestaProductor";
import {
  editarMiPropuesta,
  solicitarEdicionMiPropuesta,
} from "../../services/propuestasProductoresService";

const inputCls =
  "min-h-[var(--control-height)] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";
const textareaCls =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

function whatsappEditable(valor) {
  const texto = String(valor || "").trim();
  const match = texto.match(/wa\.me\/(\d+)/i);
  return match ? `+${match[1]}` : texto;
}

function inicializarForm(propuesta) {
  return {
    nombre: propuesta?.nombre || "",
    descripcion: propuesta?.descripcion || "",
    provincia: propuesta?.provincia || "",
    canton: propuesta?.canton || "",
    distrito: propuesta?.distrito || "",
    direccion: propuesta?.direccion || propuesta?.senas || "",
    enlaceUbicacion: propuesta?.enlaceUbicacion || "",
    facebook: propuesta?.facebook || "",
    instagram: propuesta?.instagram || "",
    whatsapp: whatsappEditable(propuesta?.whatsapp),
    sitioWeb: propuesta?.sitioWeb || "",
    correo: propuesta?.correo || "",
    telefono: String(propuesta?.telefono || "").replace(/\D/g, ""),
    motivoCambio: "",
  };
}

function CampoForm({ id, label, error, children, ancho = false, requerido = false }) {
  return (
    <div className={`grid gap-1.5 ${ancho ? "md:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-[length:var(--text-body)] font-medium text-slate-700">
        <ST>{label}</ST>
        {requerido ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <span className="text-[length:var(--text-body)] text-rose-700">
          <ST>{error}</ST>
        </span>
      ) : null}
    </div>
  );
}

export function ModalEditarMiPropuesta({
  open,
  onClose,
  propuesta,
  esSolicitud = false,
  onGuardado,
}) {
  const [form, setForm] = useState(() => inicializarForm(propuesta));
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const tSeleccione = useTraducir("Seleccione una opción");

  useEffect(() => {
    if (propuesta) {
      setForm(inicializarForm(propuesta));
      setImagenFile(null);
      setImagenPreview(propuesta.imagenUrl || "");
      setErrores({});
      setErrorGeneral("");
    }
  }, [propuesta, open]);

  useEffect(() => {
    if (!imagenFile) return undefined;
    const objectUrl = URL.createObjectURL(imagenFile);
    setImagenPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imagenFile]);

  if (!open || !propuesta) return null;

  const cambiar = (campo, valor) => {
    setForm((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === "provincia") {
        siguiente.canton = "";
        siguiente.distrito = "";
      }
      if (campo === "canton") {
        siguiente.distrito = "";
      }
      return siguiente;
    });
    setErrores((actual) => ({ ...actual, [campo]: "" }));
    setErrorGeneral("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validarImagenArchivo(file);
    if (err) {
      setErrores((prev) => ({ ...prev, imagen: err }));
      return;
    }
    setErrores((prev) => ({ ...prev, imagen: "" }));
    setImagenFile(file);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorGeneral("");

    const errs = validarEdicionPropuesta(form);
    if (imagenFile) {
      const imgErr = validarImagenArchivo(imagenFile);
      if (imgErr) errs.imagen = imgErr;
    }
    if (esSolicitud) {
      const motivo = String(form.motivoCambio || "").trim();
      if (!motivo) {
        errs.motivoCambio = "Por favor indica el motivo del cambio solicitado.";
      } else if (motivo.length < 10) {
        errs.motivoCambio = "Escribe al menos 10 caracteres explicando el motivo del cambio.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      setErrorGeneral("Por favor revisá los campos marcados antes de continuar.");
      return;
    }

    setGuardando(true);
    try {
      let resultado;
      if (esSolicitud) {
        resultado = await solicitarEdicionMiPropuesta(
          propuesta.id,
          form,
          imagenFile,
          form.motivoCambio.trim(),
        );
      } else {
        resultado = await editarMiPropuesta(propuesta.id, form, imagenFile);
      }
      if (onGuardado) onGuardado(resultado);
      onClose();
    } catch (err) {
      setErrorGeneral(err?.message || "No se pudo guardar la propuesta.");
    } finally {
      setGuardando(false);
    }
  };

  const texto = (campo, label, extra = {}) => (
    <CampoForm
      id={`edit-mi-${campo}`}
      label={label}
      error={errores[campo]}
      ancho={extra.ancho}
      requerido={extra.requerido}
    >
      <input
        id={`edit-mi-${campo}`}
        type={extra.type || "text"}
        value={form[campo]}
        maxLength={extra.maxLength || URL_MAX}
        placeholder={extra.placeholder}
        onChange={(event) =>
          cambiar(
            campo,
            extra.type === "email" ? limpiarCorreo(event.target.value) : event.target.value,
          )
        }
        className={inputCls}
      />
    </CampoForm>
  );

  return (
    <AdminModal open={open} onClose={() => !guardando && onClose()} maxWidth="max-w-2xl">
      <AdminModalHeader>
        <ST>
          {esSolicitud
            ? "Solicitar cambios para mi emprendimiento"
            : "Editar datos de la propuesta"}
        </ST>
      </AdminModalHeader>
      <AdminModalBody>
        {esSolicitud ? (
          <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-[length:var(--text-body)] text-sky-950">
            <p className="font-semibold">
              <ST>Tu emprendimiento ya está aprobado y visible en el catálogo público.</ST>
            </p>
            <p className="mt-1 text-sm text-sky-800">
              <ST>
                Los cambios que envíes aquí serán revisados por el equipo administrativo. Una vez
                aprobados, se actualizará tu perfil publicado automáticamente.
              </ST>
            </p>
          </div>
        ) : propuesta.estado === "Rechazada" ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-[length:var(--text-body)] text-amber-950">
            <p className="font-semibold">
              <ST>Reenvío de propuesta rechazada</ST>
            </p>
            <p className="mt-1 text-sm text-amber-800">
              <ST>
                Al guardar tus correcciones, la propuesta volverá a evaluarse en estado Pendiente
                para que el equipo administrativo la revise de nuevo.
              </ST>
            </p>
          </div>
        ) : null}

        <form onSubmit={guardar} noValidate className="space-y-6">
          {esSolicitud ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <CampoForm
                id="edit-mi-motivo"
                label="¿Por qué solicitas estos cambios? (Obligatorio)"
                error={errores.motivoCambio}
                ancho
                requerido
              >
                <textarea
                  id="edit-mi-motivo"
                  rows={3}
                  maxLength={500}
                  placeholder="Por ejemplo: actualizamos el número de teléfono y el menú de productos disponibles."
                  value={form.motivoCambio}
                  onChange={(e) => cambiar("motivoCambio", e.target.value)}
                  className={textareaCls}
                />
              </CampoForm>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            {texto("nombre", "Nombre del emprendimiento", {
              maxLength: NOMBRE_MAX,
              ancho: true,
              requerido: true,
            })}

            <CampoForm
              id="edit-mi-descripcion"
              label="Descripción del emprendimiento"
              error={errores.descripcion}
              ancho
              requerido
            >
              <textarea
                id="edit-mi-descripcion"
                rows={4}
                maxLength={DESCRIPCION_MAX}
                value={form.descripcion}
                onChange={(event) => cambiar("descripcion", event.target.value)}
                className={textareaCls}
              />
            </CampoForm>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <h4 className="text-sm font-bold text-slate-800">
              <ST>Ubicación</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              <CampoForm id="edit-mi-provincia" label="Provincia" error={errores.provincia} requerido>
                <SelectFiltro
                  id="edit-mi-provincia"
                  value={form.provincia}
                  onChange={(event) => cambiar("provincia", event.target.value)}
                >
                  <option value="">{tSeleccione}</option>
                  {PROVINCIAS_CR.map((provincia) => (
                    <option key={provincia} value={provincia}>
                      {provincia}
                    </option>
                  ))}
                </SelectFiltro>
              </CampoForm>
              <CampoForm id="edit-mi-canton" label="Cantón" error={errores.canton} requerido>
                <SelectFiltro
                  id="edit-mi-canton"
                  value={form.canton}
                  disabled={!form.provincia}
                  onChange={(event) => cambiar("canton", event.target.value)}
                >
                  <option value="">{tSeleccione}</option>
                  {cantonesDeProvincia(form.provincia).map((canton) => (
                    <option key={canton} value={canton}>
                      {canton}
                    </option>
                  ))}
                </SelectFiltro>
              </CampoForm>
              <CampoForm id="edit-mi-distrito" label="Distrito" error={errores.distrito} requerido>
                <SelectFiltro
                  id="edit-mi-distrito"
                  value={form.distrito}
                  disabled={!form.canton}
                  onChange={(event) => cambiar("distrito", event.target.value)}
                >
                  <option value="">{tSeleccione}</option>
                  {distritosDeCanton(form.provincia, form.canton).map((distrito) => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </SelectFiltro>
              </CampoForm>
            </div>

            <CampoForm
              id="edit-mi-direccion"
              label="Dirección o señas exactas"
              error={errores.direccion}
              ancho
              requerido
            >
              <textarea
                id="edit-mi-direccion"
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
              requerido: true,
            })}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <h4 className="text-sm font-bold text-slate-800">
              <ST>Redes y contacto</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {texto("facebook", "Facebook", { type: "url", placeholder: "https://facebook.com/..." })}
              {texto("instagram", "Instagram", { type: "url", placeholder: "https://instagram.com/..." })}
              {texto("whatsapp", "WhatsApp (+506 ...)", { placeholder: "+506 8888 8888", maxLength: 20 })}
              {texto("sitioWeb", "Sitio web", { type: "url", placeholder: "https://..." })}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {texto("correo", "Correo electrónico de contacto", {
                type: "email",
                maxLength: 200,
                requerido: true,
              })}
              <CampoForm id="edit-mi-telefono" label="Teléfono de contacto" error={errores.telefono} requerido>
                <NumericInput
                  id="edit-mi-telefono"
                  name="telefono"
                  maxLength={15}
                  value={form.telefono}
                  onChange={(event) => cambiar("telefono", event.target.value)}
                  className={inputCls}
                />
              </CampoForm>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <h4 className="text-sm font-bold text-slate-800">
              <ST>Imagen o logotipo representativo</ST>
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              {imagenPreview ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={imagenPreview}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                <ImagePlus className="size-4" />
                <span>
                  <ST>{imagenPreview ? "Cambiar imagen" : "Seleccionar imagen"}</ST>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {imagenFile ? (
                <span className="text-xs text-emerald-700 font-medium">
                  {imagenFile.name} ({(imagenFile.size / 1024).toFixed(0)} KB)
                </span>
              ) : null}
            </div>
            {errores.imagen ? (
              <p className="text-xs text-rose-700"><ST>{errores.imagen}</ST></p>
            ) : null}
          </section>

          {errorGeneral ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              <ST>{errorGeneral}</ST>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button type="submit" className={adminBtnPrimary} disabled={guardando}>
              {esSolicitud ? (
                <Send className="mr-1.5 size-4" aria-hidden="true" />
              ) : (
                <Save className="mr-1.5 size-4" aria-hidden="true" />
              )}
              {guardando ? (
                <ST>Enviando...</ST>
              ) : (
                <ST>{esSolicitud ? "Enviar solicitud de cambios" : "Guardar cambios"}</ST>
              )}
            </button>
            <button
              type="button"
              className={adminBtnVoluntariadoCancel}
              disabled={guardando}
              onClick={onClose}
            >
              <ST>Cancelar</ST>
            </button>
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
