import { useEffect, useState } from "react";
import {
  guardarIdioma,
  IDIOMA_CHANGED_EVENT,
  obtenerIdioma,
} from "../../lib/idioma";
import { clearInformacionHttpCache } from "../../services/informacionService";
import "./LanguageSwitcher.css";

/**
 * Selector ES / EN. Compacto: transparente + blanco → activo blanco + negro.
 */
export function LanguageSwitcher({ className = "", compact = false }) {
  const [idioma, setIdioma] = useState(() => obtenerIdioma());

  useEffect(() => {
    const sync = () => setIdioma(obtenerIdioma());
    window.addEventListener(IDIOMA_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(IDIOMA_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const elegir = (lang) => {
    try {
      clearInformacionHttpCache();
    } catch {
      /* ignore */
    }
    const next = guardarIdioma(lang);
    setIdioma(next);
  };

  return (
    <div
      className={`lang-switch${compact ? " lang-switch--compact" : ""} ${className}`.trim()}
      role="group"
      aria-label="Idioma / Language"
    >
      <button
        type="button"
        onClick={() => elegir("es")}
        className={`lang-switch__btn${idioma === "es" ? " is-active" : ""}`}
        aria-pressed={idioma === "es"}
      >
        {compact ? "ES" : "Español"}
      </button>
      <button
        type="button"
        onClick={() => elegir("en")}
        className={`lang-switch__btn${idioma === "en" ? " is-active" : ""}`}
        aria-pressed={idioma === "en"}
      >
        {compact ? "EN" : "English"}
      </button>
    </div>
  );
}
