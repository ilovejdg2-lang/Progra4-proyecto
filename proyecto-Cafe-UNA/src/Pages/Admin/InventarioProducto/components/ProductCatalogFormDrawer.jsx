import { useEffect, useRef, useState } from "react";

import { X } from "lucide-react";

import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../../Components/Admin/ui/AdminModal";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { t } from "../../../../lib/t";
import {
  etiquetaContadorPalabras,
  hasFieldErrors,
  limitarPalabras,
  MAX_PALABRAS_PRODUCTO_DESCRIPCION,
  MAX_PALABRAS_PRODUCTO_NOMBRE,
  MAX_PRODUCTO_DESCRIPCION,
  MAX_PRODUCTO_NOMBRE,
  sanitizeUserFacingError,
  validateProductoForm,
} from "../../../../lib/formLimits";
import { queueFocusFormError } from "../../../../lib/formFocus";
import {
  parsearImagenesProducto,
  serializarImagenesProducto,
} from "../../../../lib/productoImagenes";
import { TIPO_CATEGORIA_PRODUCTO } from "../../../../lib/categorias";
import { CategoriaCampo } from "../../../../Components/Admin/ui/CategoriaCampo";
import { NumericInput } from "../../../../Components/NumericInput/NumericInput";
import { Switch } from "../../../../Components/ui/Switch";
import { UiSelect } from "../../../../Components/ui/Select";
import {
  productoEstaDeshabilitado,
  productoPuedeDestacarse,
  productoSinStock,
} from "../../../../lib/productoDisponibilidad";

const MAX_PRODUCTOS_DESTACADOS = 3;

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  imagen: "",
  imagen2: "",
  imagen3: "",
  imagen4: "",
  precioNormal: "",
  precioConIVA: "",
  estado: "Habilitado",
  peso: "",
  categoria: "",
  subcategoria: "",
  esDestacado: false,
  stockMinimo: "0",
};

function contarDestacados(productos, excluirId = null) {
  return productos.filter((item) => item.esDestacado && item.id !== excluirId).length;
}

function calcularPrecioConIVA(value) {
  return Math.round((Number(value) || 0) * 1.13);
}

function buildCatalogPayload(form) {
  return {
    nombre: form.nombre,
    descripcion: form.descripcion,
    imagen: serializarImagenesProducto([form.imagen, form.imagen2, form.imagen3, form.imagen4]),
    precioNormal: Number(form.precioNormal) || 0,
    precioConIVA: calcularPrecioConIVA(form.precioNormal),
    estado: form.estado,
    peso: form.peso,
    categoria: form.categoria,
    subcategoria: form.subcategoria,
    esDestacado: Boolean(form.esDestacado),
    stockMinimo: Math.max(0, Math.floor(Number(form.stockMinimo) || 0)),
  };
}

function formDesdeProducto(initial) {
  if (!initial) return { ...FORM_VACIO };
  const fotos = parsearImagenesProducto(initial);
  return {
    ...FORM_VACIO,
    nombre: initial.nombre ?? "",
    descripcion: initial.descripcion ?? "",
    imagen: fotos[0] || "",
    imagen2: fotos[1] || "",
    imagen3: fotos[2] || "",
    imagen4: fotos[3] || "",
    precioNormal: initial.precioNormal ?? "",
    precioConIVA: initial.precioConIVA ?? calcularPrecioConIVA(initial.precioNormal),
    estado: initial.estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado",
    peso: initial.peso ?? "",
    categoria: initial.categoria ?? "",
    subcategoria: initial.subcategoria ?? "",
    esDestacado: Boolean(initial.esDestacado),
    stockMinimo: String(initial.stockMinimo ?? 0),
  };
}

function errorId(field) {
  return `producto-${field}-error`;
}

export function ProductCatalogFormDrawer({
  open,
  initial,
  products = [],
  categorias = [],
  onCategoriaCreada,
  onSave,
  onClose,
  isSaving = false,
}) {
  const [form, setForm] = useState(() => formDesdeProducto(initial));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const submitGuard = useRef(false);
  const isEditing = Boolean(initial);
  const featuredOthers = contarDestacados(products, initial?.id);
  const stockForEligibility = Number(initial?.stock) || 0;

  useEffect(() => {
    if (!open) return;
    setForm(formDesdeProducto(initial));
    setFieldErrors({});
    setSubmitError("");
    submitGuard.current = false;
  }, [open, initial]);

  if (!open) return null;

  const setFieldError = (name, message) => {
    setFieldErrors((current) => ({ ...current, [name]: message }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    if (name !== "nombre" && name !== "descripcion") return;
    const errors = validateProductoForm(form);
    setFieldError(name, errors[name] || "");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "esDestacado" && checked) {
      if (featuredOthers >= MAX_PRODUCTOS_DESTACADOS) {
        setSubmitError(`Solo puedes destacar hasta ${MAX_PRODUCTOS_DESTACADOS} productos en el inicio.`);
        return;
      }
      const draft = { estado: form.estado, stock: stockForEligibility };
      if (!productoPuedeDestacarse(draft)) {
        setSubmitError(
          productoEstaDeshabilitado(draft)
            ? "No puedes destacar un producto inactivo."
            : "No puedes destacar un producto sin stock.",
        );
        return;
      }
    }

    if (name === "estado" && value === "Deshabilitado" && form.esDestacado) {
      setSubmitError("Quita el producto de destacados antes de desactivarlo.");
      return;
    }

    let nextValue = type === "checkbox" ? checked : value;
    if (name === "nombre") nextValue = limitarPalabras(value, MAX_PALABRAS_PRODUCTO_NOMBRE);
    if (name === "descripcion") nextValue = limitarPalabras(value, MAX_PALABRAS_PRODUCTO_DESCRIPCION);

    setForm((current) => ({
      ...current,
      [name]: nextValue,
      precioConIVA: name === "precioNormal" ? calcularPrecioConIVA(nextValue) : current.precioConIVA,
    }));

    if (name === "nombre" || name === "descripcion") setFieldError(name, "");
    setSubmitError("");
  };

  const focusFirstInvalidField = (errors) => {
    queueFocusFormError({
      errors,
      root: document.querySelector('[role="dialog"]'),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitGuard.current || isSaving) return;

    const errors = validateProductoForm(form);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setSubmitError("");
      focusFirstInvalidField(errors);
      return;
    }

    const payload = buildCatalogPayload(form);
    const eligibilityInput = { ...payload, stock: stockForEligibility };
    if (payload.esDestacado && !productoPuedeDestacarse(eligibilityInput)) {
      setSubmitError(
        productoEstaDeshabilitado(eligibilityInput)
          ? "No puedes destacar un producto inactivo."
          : "No puedes destacar un producto sin stock.",
      );
      return;
    }
    if (payload.esDestacado && productoSinStock(eligibilityInput)) {
      setSubmitError("Quita el destacado antes de dejar el stock en cero.");
      return;
    }

    submitGuard.current = true;
    setFieldErrors({});
    setSubmitError("");

    try {
      await onSave(payload);
    } catch (error) {
      setSubmitError(sanitizeUserFacingError(error?.message || "No se pudo guardar el producto."));
      submitGuard.current = false;
    }
  };

  const inputClassName =
    "w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none";
  const errorClassName = "border-red-500 focus:border-red-500";
  const fieldErrorClassName = "text-xs text-red-600";
  const fieldClassName = (name) => `${inputClassName} ${fieldErrors[name] ? errorClassName : ""}`;
  const fieldDescription = (name) => (fieldErrors[name] ? errorId(name) : undefined);
  const featuredDisabled =
    !form.esDestacado &&
    (!productoPuedeDestacarse({ estado: form.estado, stock: stockForEligibility }) ||
      featuredOthers >= MAX_PRODUCTOS_DESTACADOS);
  const tTituloEditar = useTraducir("Editar producto");
  const tTituloNuevo = useTraducir("Nuevo producto");
  const tGuardando = useTraducir("Guardando...");
  const tGuardarCambios = useTraducir("Guardar cambios");
  const tCrearProducto = useTraducir("Crear producto");

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="admin-product-catalog-form-title">
      <AdminModalHeader>
        <h2 id="admin-product-catalog-form-title" className="text-lg font-semibold text-slate-950">
          {isEditing ? tTituloEditar : tTituloNuevo}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={t("Cerrar")}
        >
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Nombre</ST>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={MAX_PRODUCTO_NOMBRE}
                className={fieldClassName("nombre")}
                aria-invalid={Boolean(fieldErrors.nombre)}
                aria-describedby={fieldDescription("nombre")}
                required
              />
              <span className="text-xs font-normal text-slate-400">
                {etiquetaContadorPalabras(form.nombre, MAX_PALABRAS_PRODUCTO_NOMBRE)}
              </span>
              {fieldErrors.nombre ? (
                <span id={errorId("nombre")} className={fieldErrorClassName} role="alert">
                  {fieldErrors.nombre}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Descripción</ST>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                maxLength={MAX_PRODUCTO_DESCRIPCION}
                className={`${fieldClassName("descripcion")} min-h-[6rem] resize-y rounded-2xl break-words whitespace-pre-wrap overflow-x-hidden`}
                aria-invalid={Boolean(fieldErrors.descripcion)}
                aria-describedby={fieldDescription("descripcion")}
                required
              />
              <span className="text-xs font-normal text-slate-400">
                {etiquetaContadorPalabras(form.descripcion, MAX_PALABRAS_PRODUCTO_DESCRIPCION)}
              </span>
              {fieldErrors.descripcion ? (
                <span id={errorId("descripcion")} className={fieldErrorClassName} role="alert">
                  {fieldErrors.descripcion}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Foto principal (URL)</ST>
              <input name="imagen" value={form.imagen} onChange={handleChange} className={inputClassName} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Foto extra 2</ST>
              <input name="imagen2" value={form.imagen2} onChange={handleChange} className={inputClassName} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Foto extra 3</ST>
              <input name="imagen3" value={form.imagen3} onChange={handleChange} className={inputClassName} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Foto extra 4</ST>
              <input name="imagen4" value={form.imagen4} onChange={handleChange} className={inputClassName} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Precio normal</ST>
              <NumericInput decimal name="precioNormal" value={form.precioNormal} onChange={handleChange} className={inputClassName} required />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Precio con IVA</ST>
              <NumericInput decimal name="precioConIVA" value={form.precioConIVA} className={inputClassName} readOnly aria-readonly="true" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Peso</ST>
              <input name="peso" value={form.peso} onChange={handleChange} className={inputClassName} placeholder="500g / 1kg" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Stock mínimo (alerta por punto de venta)</ST>
              <NumericInput
                name="stockMinimo"
                value={form.stockMinimo}
                onChange={handleChange}
                className={inputClassName}
              />
              <span className="text-[length:var(--text-body)] font-normal text-slate-500">
                <ST>Se avisa si Bodega Central o cualquier punto de venta con stock (salvo Stand Ferias) queda en ese nivel o menos.</ST>
              </span>
            </label>
            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <CategoriaCampo
                tipo={TIPO_CATEGORIA_PRODUCTO}
                value={form.categoria || ""}
                extras={categorias}
                permitirCrear
                onChange={(valor) =>
                  setForm((current) => ({
                    ...current,
                    categoria: valor,
                    subcategoria: valor === current.categoria ? current.subcategoria : "",
                  }))
                }
                onCreada={onCategoriaCreada}
              />
              <CategoriaCampo
                tipo={TIPO_CATEGORIA_PRODUCTO}
                padre={form.categoria || ""}
                value={form.subcategoria || ""}
                label="Subcategoría"
                vacioLabel="Sin subcategoría"
                permitirCrear={Boolean(form.categoria)}
                placeholderNueva="Ej. Tueste medio"
                etiquetaNueva="Agregar subcategoría (ej. tueste)"
                onChange={(valor) => setForm((current) => ({ ...current, subcategoria: valor }))}
                onCreada={onCategoriaCreada}
              />
            </div>
            <div className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Estado</ST>
              <UiSelect
                ariaLabel={t("Estado")}
                value={form.estado}
                onChange={(valor) => handleChange({ target: { name: "estado", value: valor } })}
                options={[
                  { value: "Habilitado", label: t("Activo") },
                  { value: "Deshabilitado", label: t("Inactivo") },
                ]}
              />
            </div>
            <div className="md:col-span-2">
              <Switch
                id="esDestacado"
                checked={Boolean(form.esDestacado)}
                disabled={featuredDisabled && !form.esDestacado}
                onCheckedChange={(checked) => {
                  handleChange({
                    target: { name: "esDestacado", type: "checkbox", checked },
                  });
                }}
                label={t("Mostrar como destacado en el inicio")}
              />
            </div>
            <p className="text-xs text-slate-500 md:col-span-2" aria-live="polite">
              <ST>Máximo 3 productos destacados en el inicio</ST>
              {" "}
              ({Math.min(featuredOthers + (form.esDestacado ? 1 : 0), MAX_PRODUCTOS_DESTACADOS)}/{MAX_PRODUCTOS_DESTACADOS}).
              {productoEstaDeshabilitado(form) ? (
                <>
                  {" "}
                  <ST>Un producto inactivo no puede destacarse.</ST>
                </>
              ) : null}
              {!productoEstaDeshabilitado(form) && productoSinStock({ stock: stockForEligibility }) ? (
                <>
                  {" "}
                  <ST>Un producto sin stock no puede destacarse.</ST>
                </>
              ) : null}
            </p>
          </div>
          {submitError ? <p className={fieldErrorClassName} role="alert" aria-live="assertive">{submitError}</p> : null}
          <div className="flex flex-row flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <AdminModalActions
              onCancel={onClose}
              primaryLabel={isSaving ? tGuardando : isEditing ? tGuardarCambios : tCrearProducto}
              primaryDisabled={isSaving}
            />
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
