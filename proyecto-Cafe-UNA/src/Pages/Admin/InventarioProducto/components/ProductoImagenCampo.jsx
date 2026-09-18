import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

import { ImageLightbox } from "../../../../Components/ImageLightbox/ImageLightbox";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { normalizeImageUrl } from "../../../../lib/imageUtils";
import {
  esImagenSubidaProducto,
  validarArchivoImagenProducto,
} from "../../../../lib/productoImagenes";
import { subirImagenProducto } from "../../../../services/productosService";

export function ProductoImagenCampo({
  label,
  name,
  value,
  onChange,
  inputClassName,
}) {
  const fileRef = useRef(null);
  const [dropActivo, setDropActivo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [ampliada, setAmpliada] = useState(false);
  const tCta = useTraducir("Arrastrá o seleccioná una imagen");
  const tHint = useTraducir("JPG, PNG o WEBP. Máximo 10 MB.");
  const tQuitar = useTraducir("Quitar imagen");
  const tSubiendo = useTraducir("Subiendo imagen...");
  const tUrl = useTraducir("URL de la imagen");
  const tAmpliar = useTraducir("Ver imagen completa");
  const esSubida = esImagenSubidaProducto(value);
  const mostrarUrl = !esSubida;
  const previewSrc = value ? normalizeImageUrl(value) : "";

  const asignarArchivo = async (fileList) => {
    const file = fileList?.[0];
    if (!file || subiendo) return;
    const validationError = validarArchivoImagenProducto(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubiendo(true);
    try {
      const url = await subirImagenProducto(file);
      onChange({ target: { name, value: url } });
    } catch (err) {
      setError(err?.message || "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-700">
      <ST>{label}</ST>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
            onClick={() => setAmpliada(true)}
            aria-label={tAmpliar}
          >
            <img
              src={previewSrc}
              alt=""
              className="h-36 w-full object-cover"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setAmpliada(false);
              onChange({ target: { name, value: "" } });
            }}
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-slate-950 dark:bg-slate-900/90 dark:text-slate-200"
            aria-label={tQuitar}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {mostrarUrl ? (
        <input
          name={name}
          value={value}
          onChange={(event) => {
            setError("");
            onChange(event);
          }}
          className={inputClassName}
          placeholder="https://"
          aria-label={`${label}. ${tUrl}`}
        />
      ) : null}
      {ampliada && previewSrc ? (
        <ImageLightbox
          images={[previewSrc]}
          index={0}
          onClose={() => setAmpliada(false)}
          alt={label}
        />
      ) : null}
      <button
        type="button"
        className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-3 py-4 text-center transition ${
          dropActivo
            ? "border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800/80 dark:hover:border-slate-500"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDropActivo(true);
        }}
        onDragLeave={() => setDropActivo(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDropActivo(false);
          asignarArchivo(event.dataTransfer.files);
        }}
        disabled={subiendo}
      >
        <UploadCloud className="size-6 text-slate-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {subiendo ? tSubiendo : tCta}
        </span>
        <span className="text-xs font-normal text-slate-500">{tHint}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          asignarArchivo(event.target.files);
          event.target.value = "";
        }}
      />
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          <ST>{error}</ST>
        </span>
      ) : null}
    </div>
  );
}
