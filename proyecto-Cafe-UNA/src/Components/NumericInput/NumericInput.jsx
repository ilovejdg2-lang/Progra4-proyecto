import { esTeclaNumericaPermitida, filtrarDecimales, filtrarEnteros } from "../../lib/numericInput";

/**
 * Input que solo acepta números (enteros o decimales).
 * Bloquea letras al teclear, pegar o insertar.
 */
export function NumericInput({
  decimal = false,
  maxLength,
  value,
  onChange,
  name,
  onKeyDown,
  onPaste,
  onBeforeInput,
  ...rest
}) {
  const sanitize = (raw) => {
    let next = decimal ? filtrarDecimales(raw) : filtrarEnteros(raw);
    if (maxLength != null && Number.isFinite(Number(maxLength))) {
      next = next.slice(0, Number(maxLength));
    }
    return next;
  };

  const emitir = (raw, event) => {
    if (!onChange) return;
    const next = sanitize(raw);
    const target = {
      ...(event?.target || {}),
      name: name ?? event?.target?.name,
      value: next,
    };
    onChange({
      ...event,
      target,
      currentTarget: {
        ...(event?.currentTarget || {}),
        name: name ?? event?.currentTarget?.name,
        value: next,
      },
    });
  };

  return (
    <input
      {...rest}
      name={name}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      autoComplete="off"
      value={value ?? ""}
      onBeforeInput={(event) => {
        onBeforeInput?.(event);
        if (event.defaultPrevented || event.data == null) return;
        if (decimal) {
          if (/[^\d.,]/.test(event.data)) event.preventDefault();
        } else if (/\D/.test(event.data)) {
          event.preventDefault();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (!esTeclaNumericaPermitida(event.key, { decimal, valorActual: value })) {
          event.preventDefault();
        }
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        emitir(event.clipboardData.getData("text"), event);
      }}
      onChange={(event) => emitir(event.target.value, event)}
    />
  );
}
