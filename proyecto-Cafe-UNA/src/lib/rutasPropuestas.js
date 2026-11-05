import { rolesDeUsuario, tienePermiso } from "./permisos";

export function rutaMisPropuestas(user) {
  const roles = rolesDeUsuario(user);
  if (tienePermiso(roles, "ver_panel_administrativo")) return "/admin/mis-propuestas";
  return "/perfil/propuestas";
}
