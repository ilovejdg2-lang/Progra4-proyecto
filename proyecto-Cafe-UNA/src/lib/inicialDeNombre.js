/** Primera letra visible del nombre (para avatar sin foto). */
export function inicialDeNombre(nombre) {
  const texto = String(nombre ?? "").trim();
  if (!texto) return "?";
  const letra = [...texto][0];
  return letra ? letra.toUpperCase() : "?";
}
