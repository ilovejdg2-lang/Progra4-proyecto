import { Children, Fragment, isValidElement } from "react";
import { UiSelect } from "./Select";

function textoDeNodo(nodo) {
  if (nodo == null || typeof nodo === "boolean") return "";
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(textoDeNodo).join("");
  if (isValidElement(nodo)) return textoDeNodo(nodo.props.children);
  return "";
}

function opcionesDesdeHijos(children, acumuladas = []) {
  Children.forEach(children, (hijo) => {
    if (!isValidElement(hijo)) return;
    if (hijo.type === "option") {
      const etiqueta = hijo.props.children;
      const texto = textoDeNodo(etiqueta);
      acumuladas.push({
        value: String(hijo.props.value ?? texto),
        label: typeof etiqueta === "string" || typeof etiqueta === "number" ? texto : etiqueta ?? texto,
      });
      return;
    }
    if (hijo.type === Fragment || hijo.type === "optgroup") {
      opcionesDesdeHijos(hijo.props.children, acumuladas);
    }
  });
  return acumuladas;
}

/** Reemplazo de `<select>` nativo con el diseño de filtros; `onChange` recibe un evento tipo `{ target: { name, value } }`. */
export function SelectFiltro({
  name,
  value,
  onChange,
  children,
  options,
  id,
  disabled = false,
  required = false,
  className = "",
  "aria-label": ariaLabel,
  traducirOpciones = false,
  buscable,
}) {
  const opciones = options ?? opcionesDesdeHijos(children);
  const valor = value == null ? "" : String(value);

  const select = (
    <UiSelect
      id={id}
      value={valor}
      options={opciones}
      disabled={disabled}
      ariaLabel={ariaLabel}
      className={className}
      buscable={buscable ?? opciones.length > 12}
      traducirOpciones={traducirOpciones}
      onChange={(nuevo) => {
        const objetivo = { name, value: nuevo };
        onChange?.({ target: objetivo, currentTarget: objetivo });
      }}
    />
  );

  if (!required) return select;

  return (
    <div className="select-filtro">
      {select}
      <input
        className="select-filtro__requerido"
        tabIndex={-1}
        aria-hidden="true"
        required
        disabled={disabled}
        value={valor}
        onChange={() => {}}
      />
    </div>
  );
}
