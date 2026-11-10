import { useEffect, useId, useRef } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { Calendar } from "@/Components/ui/calendar";
import { ST } from "../T/ST";
import { useIdioma } from "../../lib/useIdioma";
import { formatearFechaLarga } from "../../lib/formatoFormulario";
import "../../styles/publicForm.css";

/**
 * Building blocks shared by the public request forms (voluntariado, visitas, donaciones).
 * Styles live in styles/publicForm.css and build on the --pub-* tokens of publicSystem.css.
 * Text props are plain Spanish strings (or nodes): the components wrap them in <ST>.
 */

function Texto({ children }) {
  return typeof children === "string" ? <ST>{children}</ST> : children;
}

/** One block of a form panel: plain sentence-case title, optional muted hint, 1px divider above. */
export function FormSection({ title, hint, children, id }) {
  const generatedId = useId();
  const headingId = id || generatedId;
  return (
    <section className="pub-form-section" aria-labelledby={headingId}>
      <div className="pub-form-section__head">
        <h2 id={headingId} className="pub-form-section__title">
          <Texto>{title}</Texto>
        </h2>
        {hint ? (
          <p className="pub-form-section__hint">
            <Texto>{hint}</Texto>
          </p>
        ) : null}
      </div>
      <div className="pub-form-section__body">{children}</div>
    </section>
  );
}

/** Two columns from 640px, one on phones. `cols={3}` and `cols={4}` use more columns on wide screens. */
export function FormGrid({ children, cols = 2 }) {
  return <div className={`pub-form-grid pub-form-grid--${cols}`}>{children}</div>;
}

/**
 * Label above the control, required marker, help text and error message.
 * `children` is either a node or a function that receives the accessibility props of the control:
 * `{ id, "aria-required", "aria-invalid", "aria-describedby" }`.
 */
export function Field({ id, label, required = false, hint, error, children, wide = false, as: Tag = "div" }) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const controlProps = {
    id: controlId,
    "aria-required": required ? "true" : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
  };
  return (
    <Tag className={`pub-field${wide ? " pub-field--wide" : ""}${error ? " pub-field--invalid" : ""}`}>
      <label htmlFor={controlId} className="pub-field__label">
        <Texto>{label}</Texto>
        {required ? <span className="pub-field__req" aria-hidden="true"> *</span> : null}
      </label>
      {typeof children === "function" ? children(controlProps) : children}
      {hint ? (
        <p id={hintId} className="pub-field__hint">
          <Texto>{hint}</Texto>
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </Tag>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="pub-field__error">
      <Texto>{children}</Texto>
    </p>
  );
}

/** Fieldset with a visible legend for radio or checkbox groups. */
export function ChoiceGroup({ legend, label, required = false, error, hint, children, columns = 2, slots = false, id }) {
  const generatedId = useId();
  const groupId = id || generatedId;
  const errorId = error ? `${groupId}-error` : undefined;
  return (
    <fieldset
      className={`pub-choice-group${error ? " pub-field--invalid" : ""}`}
      aria-describedby={errorId}
      aria-label={legend ? undefined : label}
      id={groupId}
    >
      {legend ? (
        <legend className="pub-field__label">
          <Texto>{legend}</Texto>
          {required ? <span className="pub-field__req" aria-hidden="true"> *</span> : null}
        </legend>
      ) : null}
      {hint ? (
        <p className="pub-field__hint">
          <Texto>{hint}</Texto>
        </p>
      ) : null}
      <div className={`pub-choice-list pub-choice-list--${slots ? "slots" : columns}`}>{children}</div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}

/**
 * Real radio (or checkbox) input inside a label styled as a card.
 * Selected = coffee-soft fill + coffee border, disabled = dashed border with the reason in text.
 */
export function ChoiceCard({
  type = "radio",
  title,
  description,
  meta,
  reason,
  disabled = false,
  variant = "card",
  className = "",
  ...inputProps
}) {
  return (
    <label className={`pub-choice pub-choice--${variant}${className ? ` ${className}` : ""}`}>
      <input type={type} className="pub-choice__input" disabled={disabled} {...inputProps} />
      <span className="pub-choice__body">
        <span className="pub-choice__title">
          <Texto>{title}</Texto>
        </span>
        {description ? (
          <span className="pub-choice__desc">
            <Texto>{description}</Texto>
          </span>
        ) : null}
        {meta}
        {disabled && reason ? (
          <span className="pub-choice__desc">
            <Texto>{reason}</Texto>
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Capacity line of a time slot: coloured dot (amber only for low capacity) plus the text. */
export function CupoTexto({ estado, texto }) {
  return (
    <span className={`pub-cupo pub-cupo--${estado}`}>
      <span className="pub-cupo__dot" aria-hidden="true" />
      <ST>{texto}</ST>
    </span>
  );
}

/** Info (coffee-soft) or warning (warm amber, role=alert) box with a drawn icon. */
export function FormNote({ tone = "info", icon, title, children, className = "", ...rest }) {
  const Icono = icon || (tone === "warning" ? AlertTriangle : Info);
  return (
    <div
      className={`pub-form-note pub-form-note--${tone}${className ? ` ${className}` : ""}`}
      role={tone === "warning" ? "alert" : undefined}
      {...rest}
    >
      <Icono size={18} aria-hidden="true" />
      <div className="pub-form-note__text">
        {title ? (
          <strong>
            <Texto>{title}</Texto>
          </strong>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** Empty or loading line inside a form section (calendar waiting for a choice, etc.). */
export function FormPlaceholder({ loading = false, title, children }) {
  return (
    <div className="pub-form-placeholder">
      {loading ? <span className="pub-spinner" aria-hidden="true" /> : null}
      {title ? (
        <p className="pub-form-placeholder__title">
          <Texto>{title}</Texto>
        </p>
      ) : null}
      {children ? (
        <p className="pub-form-placeholder__text">
          <Texto>{children}</Texto>
        </p>
      ) : null}
    </div>
  );
}

/** Error banner at the end of a form (role=alert). */
export function FormAlert({ children, ...rest }) {
  if (!children) return null;
  return (
    <p className="pub-alert pub-form__alert" role="alert" data-form-error {...rest}>
      <AlertTriangle size={18} aria-hidden="true" />
      <Texto>{children}</Texto>
    </p>
  );
}

/** Required-fields note on the left, coffee primary submit on the right (full width on phones). */
export function SubmitFooter({ label, busyLabel, busy = false, disabled = false }) {
  return (
    <div className="pub-form__footer">
      <p className="pub-form__required-note">
        <ST>Los campos con * son obligatorios.</ST>
      </p>
      <button type="submit" className="pub-btn pub-btn--primary pub-form__submit" disabled={disabled || busy}>
        {busy ? <span className="pub-spinner" aria-hidden="true" /> : null}
        <Texto>{busy ? busyLabel || label : label}</Texto>
      </button>
    </div>
  );
}

/** Success screen shared by the three forms. */
export function FormSuccess({ title, summary, children }) {
  const titleRef = useRef(null);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="pub-panel pub-form-success" role="status">
      <span className="pub-form-success__icon" aria-hidden="true">
        <Check size={28} strokeWidth={2.2} />
      </span>
      <h2 ref={titleRef} tabIndex={-1} className="pub-serif-title pub-form-success__title">
        <Texto>{title}</Texto>
      </h2>
      <p className="pub-form-success__summary">
        <Texto>{summary}</Texto>
      </p>
      <div className="pub-form-success__actions">{children}</div>
    </div>
  );
}

/**
 * White bordered calendar box with the chosen date in sentence case and a legend.
 * Wraps the shadcn Calendar; `enabledDates` get the coffee-soft "available" style.
 */
export function CalendarPicker({
  selected,
  onSelect,
  disabled,
  locale,
  enabledDates,
  legend,
  invalid = false,
  describedBy,
}) {
  const { idioma } = useIdioma();
  const fechaLarga = formatearFechaLarga(selected, idioma);
  return (
    <div className="pub-calendar" aria-invalid={invalid ? "true" : undefined} aria-describedby={describedBy}>
      <p className="pub-calendar__selected" aria-live="polite">
        {fechaLarga ? (
          <>
            <ST>Fecha elegida</ST>: <strong>{fechaLarga}</strong>
          </>
        ) : (
          <ST>Todavía no elegiste una fecha</ST>
        )}
      </p>
      <Calendar
        mode="single"
        selected={selected || undefined}
        onSelect={onSelect}
        disabled={disabled}
        locale={locale}
        modifiers={{ habilitado: enabledDates }}
        modifiersClassNames={{ habilitado: "rdp-day-habilitado" }}
        captionLayout="dropdown"
      />
      <ul className="pub-calendar__legend">
        <li>
          <span className="pub-calendar__swatch pub-calendar__swatch--on" aria-hidden="true">15</span>
          <ST>{legend}</ST>
        </li>
        <li>
          <span className="pub-calendar__swatch pub-calendar__swatch--off" aria-hidden="true">15</span>
          <ST>Fecha no disponible</ST>
        </li>
      </ul>
    </div>
  );
}
