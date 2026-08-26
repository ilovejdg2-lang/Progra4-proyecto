export const TIPO_CATEGORIA_PRODUCTO = "producto";
export const TIPO_CATEGORIA_GALERIA = "galeria";

export function nombreCategoria(valor) {
  return String(valor || "").trim();
}

export function esCategoriaRaiz(item) {
  return !nombreCategoria(item?.padre ?? item?.Padre);
}

export function categoriasUnicas(items, obtener = (item) => item?.categoria) {
  const vistas = new Set();
  const lista = [];
  for (const item of items || []) {
    const nombre = nombreCategoria(obtener(item));
    if (!nombre || vistas.has(nombre.toLowerCase())) continue;
    vistas.add(nombre.toLowerCase());
    lista.push(nombre);
  }
  return lista.sort((a, b) => a.localeCompare(b, "es"));
}

export function filtrarPorCategoria(items, categoria, obtener = (item) => item?.categoria) {
  const seleccion = nombreCategoria(categoria);
  if (!seleccion || seleccion === "todas") return items || [];
  return (items || []).filter(
    (item) => nombreCategoria(obtener(item)).toLowerCase() === seleccion.toLowerCase(),
  );
}

export function etiquetaCategoriaProducto(producto) {
  const categoria = nombreCategoria(producto?.categoria);
  const subcategoria = nombreCategoria(producto?.subcategoria);
  if (categoria && subcategoria) return `${categoria} · ${subcategoria}`;
  return categoria || subcategoria || "";
}
