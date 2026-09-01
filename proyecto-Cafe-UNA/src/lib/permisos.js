const SA = "SuperAdmin";
const AD = "Admin";
const VE = "Vendedor";
const CL = "Cliente";
const US = "Usuario";

const logueados = [SA, AD, VE, CL, US];
const staff = [SA, AD, VE];
const admins = [SA, AD];
const todosRoles = [SA, AD, VE, CL, US];

/** Matriz en memoria; se puede refrescar desde /api/ajustes/permisos. */
export let PERMISOS_POR_ROL = {
  ver_informacion: todosRoles,
  agregar_imagenes_galeria: admins,
  actualizar_informacion: admins,
  inactivar_informacion: admins,
  ver_panel_administrativo: staff,
  crear_usuarios: [SA],
  editar_usuarios: [SA],
  inactivar_usuarios: [SA],
  asignar_roles: [SA],
  administrar_roles_permisos: [SA],
  actualizar_perfil_propio: logueados,
  cambiar_contrasena_propia: logueados,
  ver_perfil_propio: logueados,
  ver_panel_usuario_propio: logueados,
  registrar_ventas: staff,
  actualizar_ventas: staff,
  ver_ventas: staff,
  cancelar_ventas: staff,
  ver_reportes: staff,
  ver_productos: todosRoles,
  crear_productos: [SA],
  comprar_productos: [CL],
  actualizar_stock_productos: staff,
  ajustar_stock_ubicaciones: staff,
  actualizar_productos: admins,
  inactivar_productos: admins,
  ver_historial_compras_clientes: staff,
  ver_historial_compras_propio: [CL],
  ver_inventario: admins,
  actualizar_inventario: admins,
  agregar_articulo_inventario: admins,
  inactivar_articulo_inventario: admins,
  ver_productores: todosRoles,
  administrar_solicitudes_productores: admins,
  agregar_productor: admins,
  actualizar_productor: [SA],
  inactivar_productor: [SA],
  ver_todas_las_facturas: staff,
  crear_facturas_hacienda: staff,
  ver_factura_propia: staff,
  crear_su_propia_factura: staff,
  actualizar_facturas: staff,
  descargar_su_propia_factura: [SA, AD, VE, CL],
  descargar_facturas: staff,
  inactivar_facturas: staff,
  ver_documentacion_visible: todosRoles,
  ver_documentacion_privada: admins,
  crear_documentacion: admins,
  actualizar_documentacion: admins,
  administrar_solicitudes_documentacion: admins,
  inactivar_documentacion: [SA],
  administrar_solicitudes_visitantes: admins,
  crear_solicitud_visitante: logueados,
  actualizar_visitas: [SA],
  inactivar_visita: [SA],
  ver_solicitudes_voluntariado: admins,
  ingresar_solicitud_voluntariado: logueados,
  administrar_solicitudes_voluntariado: admins,
  actualizar_solicitud_voluntariado: [SA],
  inactivar_voluntariado: [SA],
  ver_solicitudes_donacion: admins,
  hacer_solicitud_donacion: logueados,
  administrar_solicitudes_donaciones: admins,
  actualizar_solicitud_donaciones: [SA],
  inactivar_donacion: admins,
  ver_auditoria: [SA],
};

export function aplicarMatrizPermisos(matriz) {
  if (!matriz || typeof matriz !== "object") return;
  PERMISOS_POR_ROL = { ...PERMISOS_POR_ROL, ...matriz };
}

function normalizarRol(rol) {
  const valor = String(rol ?? "").trim().toLowerCase();
  if (valor === "superadmin") return SA;
  if (valor === "admin") return AD;
  if (valor === "vendedor") return VE;
  if (valor === "cliente") return CL;
  if (valor === "usuario") return US;
  return String(rol ?? "").trim();
}

export function tienePermiso(roles, codigo) {
  const permitidos = PERMISOS_POR_ROL[codigo];
  if (!permitidos) return false;
  const propios = (Array.isArray(roles) ? roles : []).map(normalizarRol);
  return permitidos.some((rol) => propios.includes(rol));
}

export function rolesDeUsuario(user) {
  if (Array.isArray(user?.roles) && user.roles.length > 0) return user.roles;
  if (Array.isArray(user?.Roles) && user.Roles.length > 0) return user.Roles;
  if (typeof user?.rol === "string" && user.rol.trim()) return [user.rol.trim()];
  if (typeof user?.Rol === "string" && user.Rol.trim()) return [user.Rol.trim()];
  if (
    typeof user?.role === "string" &&
    user.role.trim() &&
    user.role.toLowerCase() !== "admin" &&
    user.role.toLowerCase() !== "user"
  ) {
    return [user.role.trim()];
  }
  return [];
}
