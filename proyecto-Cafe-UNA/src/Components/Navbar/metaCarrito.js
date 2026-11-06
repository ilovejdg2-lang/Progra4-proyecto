export function metaCarrito(item) {
  return [item?.peso, item?.subcategoria]
    .map((valor) => String(valor || "").trim())
    .filter(Boolean)
    .join(" · ");
}
