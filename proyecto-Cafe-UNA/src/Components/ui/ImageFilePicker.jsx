import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { ST } from "../T/ST";
import { useTraducir } from "../../hooks/useTraducir";

export function ImageFilePicker({ id, accept, hint, onSelect, disabled = false, required = false, error = "" }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const action = useTraducir("Arrastra o selecciona una imagen");
  const description = `${id}-selection-help`;
  const errorId = `${id}-selection-error`;

  const select = (files) => {
    if (!disabled && files?.[0]) onSelect(files[0]);
  };

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        aria-label={action}
        aria-describedby={error ? `${description} ${errorId}` : description}
        className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-3 py-4 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:focus-visible:outline-slate-300 disabled:cursor-not-allowed disabled:opacity-60 ${dragActive ? "border-slate-400 bg-slate-100 dark:bg-slate-800" : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800/80"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          select(event.dataTransfer.files);
        }}
      >
        <UploadCloud size={22} className="text-slate-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{action}</span>
        <span id={description} className="text-xs font-normal text-slate-600 dark:text-slate-300"><ST>{hint}</ST></span>
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${description} ${errorId}` : description}
        onChange={(event) => {
          select(event.target.files);
          event.target.value = "";
        }}
      />
      {error ? <span id={errorId} className="mensaje-error text-sm text-red-600 dark:text-red-400" role="alert"><ST>{error}</ST></span> : null}
    </div>
  );
}
