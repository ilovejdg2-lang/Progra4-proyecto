export const RUTA_SOLICITUDES_CLIENTE = "/perfil/solicitudes";
export const RUTA_SOLICITUDES_ADMIN = "/admin/mis-solicitudes";

export function rutaMisSolicitudes(user) {
  return user?.role === "admin" ? RUTA_SOLICITUDES_ADMIN : RUTA_SOLICITUDES_CLIENTE;
}
