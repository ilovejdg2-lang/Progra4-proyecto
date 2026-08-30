import { useTraducir } from "../../hooks/useTraducir";

/** Muestra texto en el idioma actual (traduce ES→EN al vuelo). */
export function T({ children, as: Tag = "span", className, ...rest }) {
  const texto = typeof children === "string" || typeof children === "number"
    ? String(children)
    : "";
  const trad = useTraducir(texto);
  if (!texto && children != null && typeof children !== "string") {
    return children;
  }
  return (
    <Tag className={className} {...rest}>
      {trad}
    </Tag>
  );
}
