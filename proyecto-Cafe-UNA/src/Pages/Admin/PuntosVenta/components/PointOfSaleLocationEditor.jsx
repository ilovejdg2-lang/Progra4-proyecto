import { useEffect, useState } from "react";
import { Store, X } from "lucide-react";

import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../../Components/Admin/ui/AdminModal";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { t } from "../../../../lib/t";
import { useIdioma } from "../../../../lib/useIdioma";
import {
  mensajeDireccionPunto,
  mensajeHorarioPunto,
  mensajeImagenPunto,
  mensajeMapsPunto,
  mensajeTelefonoPunto,
} from "../../../../lib/puntoVentaPresentacion";
import { asegurarCamposEnEspanol, camposParaVistaAdmin } from "../../../../lib/traducir";
import { ProductoImagenCampo } from "../../InventarioProducto/components/ProductoImagenCampo";
import { subirImagenPuntoVenta } from "../../../../services/productosService";

const CAMPOS_TEXTO = ["nombre", "direccion", "horario"];
const INPUT_CLASS =
  "min-h-11 rounded-2xl border bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

export function PointOfSaleLocationEditor({
  open,
  location = null,
  onClose,
  onSave,
  isSaving = false,
  error = "",
}) {
  const isEdit = Boolean(location?.code);
  const { idioma } = useIdioma();
  const tEditar = useTraducir("Editar punto de venta");
  const tAgregar = useTraducir("Agregar punto de venta");
  const tHint = useTraducir("Bodega Central no se modifica desde aquí.");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [imagenes, setImagenes] = useState(["", "", ""]);
  const [telefono, setTelefono] = useState("");
  const [horario, setHorario] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let cancelado = false;
    const base = {
      nombre: location?.name || "",
      codigo: location?.code || "",
      direccion: location?.direccion || "",
      horario: location?.horario || "",
    };
    setValidationError("");
    setNombre(base.nombre);
    setCodigo(base.codigo);
    setDireccion(base.direccion);
    setHorario(base.horario);
    setTelefono(location?.telefono || "");
    setImagenUrl(location?.imagenUrl || "");
    const extras = Array.isArray(location?.imagenes) ? location.imagenes : [];
    setImagenes([extras[0] || "", extras[1] || "", extras[2] || ""]);
    setMapsUrl(location?.mapsUrl || "");

    if (idioma !== "en") return undefined;

    (async () => {
      const traducido = await camposParaVistaAdmin(base, CAMPOS_TEXTO, idioma);
      if (cancelado) return;
      setNombre(traducido.nombre || "");
      setDireccion(traducido.direccion || "");
      setHorario(traducido.horario || "");
    })();

    return () => {
      cancelado = true;
    };
  }, [open, location, idioma]);

  if (!open) return null;

  const message = validationError || error;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedNombre = nombre.trim();
    if (normalizedNombre.length < 2 || normalizedNombre.length > 100) {
      setValidationError("El nombre debe tener entre 2 y 100 caracteres.");
      return;
    }

    const errorDireccion = mensajeDireccionPunto(direccion);
    const errorImagen = mensajeImagenPunto(imagenUrl);
    const errorMaps = mensajeMapsPunto(mapsUrl);
    const errorTelefono = mensajeTelefonoPunto(telefono);
    const errorHorario = mensajeHorarioPunto(horario);
    const errorExtra = imagenes.map(mensajeImagenPunto).find(Boolean) || null;
    const errorPresentacion = errorDireccion || errorImagen || errorMaps || errorTelefono || errorHorario || errorExtra;
    if (errorPresentacion) {
      setValidationError(errorPresentacion);
      return;
    }

    const paraGuardar = await asegurarCamposEnEspanol(
      { nombre: normalizedNombre, direccion: direccion.trim(), horario: horario.trim() },
      CAMPOS_TEXTO,
    );
    const presentacion = {
      nombre: paraGuardar.nombre,
      direccion: paraGuardar.direccion || null,
      horario: paraGuardar.horario || null,
      telefono: telefono.trim() || null,
      imagenUrl: imagenUrl.trim() || null,
      imagenes: imagenes.map((url) => String(url || "").trim()).filter(Boolean),
      mapsUrl: mapsUrl.trim() || null,
    };

    if (!isEdit) {
      const normalizedCodigo = codigo.trim().toUpperCase();
      if (normalizedCodigo && !/^POS_[A-Z0-9_]{1,45}$/.test(normalizedCodigo)) {
        setValidationError("El código debe iniciar con POS_ y usar solo letras, números o guion bajo.");
        return;
      }
      setValidationError("");
      await onSave({
        ...presentacion,
        codigo: normalizedCodigo || undefined,
      });
      return;
    }

    setValidationError("");
    await onSave(presentacion);
  };

  const inputClass = `${INPUT_CLASS} ${message ? "border-red-500" : "border-slate-200"}`;

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-2xl" labelledBy="pos-location-editor-title">
      <AdminModalHeader>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="pos-location-editor-title" className="truncate text-lg font-semibold text-slate-950">
              {isEdit ? tEditar : tAgregar}
            </h2>
            <p className="truncate text-sm text-slate-500">
              {isEdit ? location.code : tHint}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label={t("Cerrar editor de punto de venta")}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>Nombre</ST>
            <input
              name="nombre"
              type="text"
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                setValidationError("");
              }}
              className={inputClass}
              aria-invalid={Boolean(message)}
              required
            />
          </label>
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">
                <ST>Fotos del punto de venta</ST>
              </p>
              <p className="mt-1 text-xs font-normal text-slate-500">
                <ST>Podés pegar una URL o subir una imagen desde el dispositivo. JPG, PNG o WEBP. Máximo 10 MB.</ST>
              </p>
            </div>
            <ProductoImagenCampo
              label="Foto principal"
              name="imagenUrl"
              value={imagenUrl}
              onChange={(event) => {
                setImagenUrl(event.target.value);
                setValidationError("");
              }}
              inputClassName={inputClass}
              subir={subirImagenPuntoVenta}
            />
            <div className="grid gap-4 md:grid-cols-2">
              {["Foto adicional 1", "Foto adicional 2"].map((etiqueta, indice) => (
                <ProductoImagenCampo
                  key={etiqueta}
                  label={etiqueta}
                  name={`imagenExtra${indice + 1}`}
                  value={imagenes[indice] || ""}
                  onChange={(event) => {
                    const valor = event.target.value;
                    setImagenes((actual) => {
                      const siguiente = [actual[0] || "", actual[1] || "", actual[2] || ""];
                      siguiente[indice] = valor;
                      return siguiente;
                    });
                    setValidationError("");
                  }}
                  inputClassName={inputClass}
                  subir={subirImagenPuntoVenta}
                />
              ))}
            </div>
            <ProductoImagenCampo
              label="Foto adicional 3"
              name="imagenExtra3"
              value={imagenes[2] || ""}
              onChange={(event) => {
                const valor = event.target.value;
                setImagenes((actual) => [actual[0] || "", actual[1] || "", valor]);
                setValidationError("");
              }}
              inputClassName={inputClass}
              subir={subirImagenPuntoVenta}
            />
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>Dirección física</ST>
            <textarea
              name="direccion"
              value={direccion}
              maxLength={300}
              rows={3}
              onChange={(event) => {
                setDireccion(event.target.value);
                setValidationError("");
              }}
              className={`${inputClass} resize-y`}
              aria-invalid={Boolean(message)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>Teléfono</ST>
            <input
              name="telefono"
              type="tel"
              value={telefono}
              maxLength={40}
              onChange={(event) => {
                setTelefono(event.target.value);
                setValidationError("");
              }}
              placeholder="+506 0000 0000"
              className={inputClass}
              aria-invalid={Boolean(message)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>Horario</ST>
            <textarea
              name="horario"
              value={horario}
              maxLength={300}
              rows={2}
              onChange={(event) => {
                setHorario(event.target.value);
                setValidationError("");
              }}
              placeholder="Lunes a viernes, 8:00 a. m. a 4:00 p. m."
              className={`${inputClass} resize-y`}
              aria-invalid={Boolean(message)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>URL de Google Maps</ST>
            <input
              name="mapsUrl"
              type="url"
              value={mapsUrl}
              maxLength={500}
              onChange={(event) => {
                setMapsUrl(event.target.value);
                setValidationError("");
              }}
              placeholder="https://maps.app.goo.gl/..."
              className={inputClass}
              aria-invalid={Boolean(message)}
            />
            <span className="text-xs font-normal text-slate-500">
              <ST>Pegá un enlace https de Google Maps. Se abre en una pestaña nueva desde el checkout.</ST>
            </span>
          </label>
          {!isEdit ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Código (opcional)</ST>
              <input
                name="codigo"
                type="text"
                value={codigo}
                onChange={(event) => {
                  setCodigo(event.target.value);
                  setValidationError("");
                }}
                placeholder="POS_..."
                className={inputClass}
                aria-invalid={Boolean(message)}
              />
              <span className="text-xs font-normal text-slate-500">
                <ST>Si lo dejás vacío, se genera automáticamente a partir del nombre.</ST>
              </span>
            </label>
          ) : null}
          {message ? (
            <p className="text-sm text-red-600" role="alert" aria-live="assertive">
              <ST>{message}</ST>
            </p>
          ) : null}
          <div className="border-t border-slate-100 pt-4">
            <AdminModalActions
              onCancel={onClose}
              primaryLabel={isSaving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear punto"}
              primaryDisabled={isSaving}
            />
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
