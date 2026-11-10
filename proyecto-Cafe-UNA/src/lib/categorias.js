export const TIPO_CATEGORIA_PRODUCTO = "producto";
export const TIPO_CATEGORIA_GALERIA = "galeria";
export const TIPO_CATEGORIA_DOCUMENTO = "documento";

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

export function esCategoriaAdministrativa(item) {
  return item?.audiencia === "administrativa";
}

/** Opciones de select para categorías raíz de documentos, en dos grupos: repositorio público y administrativas. */
export function opcionesCategoriaDocumento(categorias, etiquetas) {
  const raices = (categorias || []).filter(esCategoriaRaiz);
  const opcion = (c) => ({ value: nombreCategoria(c.nombre ?? c.Nombre), label: nombreCategoria(c.nombre ?? c.Nombre) });
  const grupo = (clave, lista) =>
    lista.length ? [{ heading: true, value: `__${clave}`, label: etiquetas[clave] }, ...lista.map(opcion)] : [];
  return [
    { value: "", label: etiquetas.vacio },
    ...grupo("publica", raices.filter((c) => !esCategoriaAdministrativa(c))),
    ...grupo("administrativa", raices.filter(esCategoriaAdministrativa)),
  ];
}
