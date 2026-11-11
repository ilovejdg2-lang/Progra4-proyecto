import { guardarIdioma } from "../../lib/idioma";
import { useIdioma } from "../../lib/useIdioma";
import "./LanguageSwitcher.css";

/**
 * Selector ES / EN. Compacto: transparente + blanco → activo blanco + negro.
 */
export function LanguageSwitcher({ className = "", compact = false }) {
  const { idioma } = useIdioma();

  const elegir = (lang) => {
    guardarIdioma(lang);
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
