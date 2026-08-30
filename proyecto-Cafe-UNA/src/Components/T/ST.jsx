import { useTraducir } from "../../hooks/useTraducir";

function textoPlano(children) {
  if (children == null || children === false || children === true) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textoPlano).filter(Boolean).join("");
  // Evita "[object Object]" si alguien pasa un nodo React
  if (typeof children === "object" && children.props != null) {
    return textoPlano(children.props.children);
  }
  return "";
}

/** Texto ES→EN automático según idioma. */
export function ST({ children }) {
  return useTraducir(textoPlano(children));
}
