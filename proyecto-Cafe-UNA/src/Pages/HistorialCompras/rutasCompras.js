export const RUTA_COMPRAS_CLIENTE = "/perfil/compras";
export const RUTA_COMPRAS_ADMIN = "/admin/mis-compras";

export function rutaMisCompras(user) {
  return user?.role === "admin" ? RUTA_COMPRAS_ADMIN : RUTA_COMPRAS_CLIENTE;
}
