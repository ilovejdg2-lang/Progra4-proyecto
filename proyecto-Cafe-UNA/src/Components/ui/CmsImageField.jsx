import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { normalizeImageUrl } from "../../lib/imageUtils";
import { subirImagenInformacion } from "../../services/informacionService";

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAXIMO_BYTES = 10 * 1024 * 1024;

function validarArchivo(file) {
  const extensionValida = /\.(jpe?g|png|webp)$/i.test(file.name || "");
  if (!TIPOS_PERMITIDOS.has(file.type) && !extensionValida) return "La imagen debe ser JPG, PNG o WEBP.";
  if (file.size > MAXIMO_BYTES) return "La imagen debe pesar máximo 10 MB.";
  return "";
}

export function CmsImageField({
  label,
  name,
  required = false,
  maxLength,
  value,
  onChange,
  subir = subirImagenInformacion,
  onUploadingChange,
  disabled = false,
  hint = "JPG, PNG o WEBP. Máximo 10 MB.",
}) {
  const fileRef = useRef(null);
  const uploadingRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isDisabled = disabled || uploading;
  const previewUrl = normalizeImageUrl(value, { width: 800 });

  const selectFile = async (files) => {
    const file = files?.[0];
    if (!file || uploadingRef.current || disabled) return;

    const validationError = validarArchivo(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    uploadingRef.current = true;
    setError("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      onChange(await subir(file));
    } catch (uploadError) {
      setError(uploadError?.message || "No se pudo subir la imagen.");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      onUploadingChange?.(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
        {label}
        <input
          type="text"
          name={name}
          required={required}
          maxLength={maxLength}
          value={value}
          disabled={isDisabled}
          onChange={(event) => {
            setError("");
            onChange(event.target.value);
          }}
          placeholder="https://..."
          className="h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {previewUrl ? <img src={previewUrl} alt="" className="h-32 w-full rounded-2xl border border-slate-200 object-cover" /> : null}

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          selectFile(event.dataTransfer.files);
        }}
        className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-3 py-4 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-slate-300 ${dragActive ? "border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800" : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800/80 dark:hover:border-slate-500"}`}
      >
        <UploadCloud className="size-6 text-slate-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{uploading ? "Subiendo imagen..." : "Arrastrá o seleccioná una imagen"}</span>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-300">{hint}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        disabled={isDisabled}
        aria-label={`Subir archivo para ${label}`}
        onChange={(event) => selectFile(event.target.files)}
      />
      {error ? <span className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{error}</span> : null}
    </div>
  );
}
