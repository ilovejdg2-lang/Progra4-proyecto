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
import { asegurarCamposEnEspanol, camposParaVistaAdmin } from "../../../../lib/traducir";

const CAMPOS_TEXTO = ["nombre"];

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
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let cancelado = false;
    const base = {
      nombre: location?.name || "",
      codigo: location?.code || "",
    };
    setValidationError("");
    setNombre(base.nombre);
    setCodigo(base.codigo);

    if (idioma !== "en") return undefined;

    (async () => {
      const traducido = await camposParaVistaAdmin(base, CAMPOS_TEXTO, idioma);
      if (!cancelado) setNombre(traducido.nombre || "");
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

    const paraGuardar = await asegurarCamposEnEspanol(
      { nombre: normalizedNombre },
      CAMPOS_TEXTO,
    );

    if (!isEdit) {
      const normalizedCodigo = codigo.trim().toUpperCase();
      if (normalizedCodigo && !/^POS_[A-Z0-9_]{1,45}$/.test(normalizedCodigo)) {
        setValidationError("El código debe iniciar con POS_ y usar solo letras, números o guion bajo.");
        return;
      }
      setValidationError("");
      await onSave({
        nombre: paraGuardar.nombre,
        codigo: normalizedCodigo || undefined,
      });
      return;
    }

    setValidationError("");
    await onSave({ nombre: paraGuardar.nombre });
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="pos-location-editor-title">
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
              className={`min-h-11 rounded-full border bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 ${
                message ? "border-red-500" : "border-slate-200"
              }`}
              aria-invalid={Boolean(message)}
              required
            />
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
                className={`min-h-11 rounded-full border bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0 ${
                  message ? "border-red-500" : "border-slate-200"
                }`}
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
