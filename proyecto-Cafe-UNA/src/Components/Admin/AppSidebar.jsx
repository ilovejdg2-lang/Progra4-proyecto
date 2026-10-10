"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Box,
  BookOpenText,
  ChevronDown,
  HandHeart,
  History,
  Image,
  Info,
  Landmark,
  LogOut,
  Package,
  PackageMinus,
  Receipt,
  ClipboardCheck,
  ClipboardList,
  ScrollText,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  Users,
  Wrench,
  CalendarClock,
  CalendarDays,
  Shield,
  ShieldCheck,
  HandCoins,
  Sprout,
  LifeBuoy,
  ListChecks,
  Search,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "./ui/Sidebar";
import { normalizeImageUrl, getImageObjectPosition } from "../../lib/imageUtils";
import { inicialDeNombre } from "../../lib/inicialDeNombre";
import { useHomeBrandNavigation } from "../../hooks/useHomeBrandNavigation";
import { obtenerNavbar } from "../../services/informacionService";
import { clearPerfilCache, obtenerPerfil } from "../../services/perfilService";
import { tienePermiso, rolesDeUsuario } from "../../lib/permisos";
import { cancelPendingSessionRefresh } from "../../services/apiClient";
import { soltarCarritoAlCerrarSesion } from "../../lib/cartSync";
import {
  applyPerfilToSession,
  beginLogout,
  clearSession,
  getActiveSessionUser,
  getStoredUser,
  SESSION_UPDATED_EVENT,
} from "../../services/sessionService";
import {
  ADMIN_THEME_CHANGED_EVENT,
  isAdminThemeDark,
} from "../../lib/adminTheme";
import { readBrandLogos, LOGO_CLARO_FALLBACK, LOGO_OSCURO_FALLBACK, cacheBrandLogos } from "../../lib/brandLogoCache";
import { ST } from "../T/ST";
import { textoUi } from "../../lib/textoVisible";
import { traducirSync } from "../../lib/traducir";
import { useTraducir } from "../../hooks/useTraducir";

const GENERAL_OPEN_KEY = "admin-sidebar-general-open";
const INVENTORY_OPEN_KEY = "admin-sidebar-inventory-open";
const VOLUNTARIADO_OPEN_KEY = "admin-sidebar-voluntariado-open";
const VISITAS_OPEN_KEY = "admin-sidebar-visitas-open";
const DONACIONES_OPEN_KEY = "admin-sidebar-donaciones-open";
const FORMULARIOS_OPEN_KEY = "admin-sidebar-formularios-open";
const SOBRE_NOSOTROS_OPEN_KEY = "admin-sidebar-sobre-nosotros-open";
const AJUSTES_OPEN_KEY = "admin-sidebar-ajustes-open";
const DOCUMENTACION_OPEN_KEY = "admin-sidebar-documentacion-open";
const MI_CUENTA_OPEN_KEY = "admin-sidebar-mi-cuenta-open";
const linkActivo = {
  className: "text-slate-950",
};

function claveBusqueda(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function AppSidebar() {
  const [user, setUser] = useState(() => getActiveSessionUser());
  const { setOpenMobile } = useSidebar();
  const displayName = textoUi(user?.name || user?.username || "Usuario");
  const displayEmail = user?.email || user?.correo || "";
  const roles = rolesDeUsuario(user);
  const puedeCms = tienePermiso(roles, "actualizar_informacion");
  const puedeGaleria = tienePermiso(roles, "agregar_imagenes_galeria");
  const puedeVerCmsGrupo = puedeCms || puedeGaleria;

  const puedeInventario = tienePermiso(roles, "ver_inventario");
  const puedePuntosVenta =
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "actualizar_inventario") ||
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ver_ventas");
  const puedeActivosFijos = tienePermiso(roles, "ver_inventario") || tienePermiso(roles, "actualizar_inventario");
  const puedeDistribucion = tienePermiso(roles, "ver_inventario");
  const puedeProductos = tienePermiso(roles, "ver_productos") || tienePermiso(roles, "ver_inventario");
  const puedeVentasPresenciales =
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ajustar_stock_ubicaciones");
  const puedeSalidasBodega = tienePermiso(roles, "ajustar_stock_ubicaciones");
  const puedeVentas =
    tienePermiso(roles, "ver_ventas") ||
    tienePermiso(roles, "ver_historial_compras_clientes");
  const puedeVerInventarioGrupo =
    puedeInventario || puedePuntosVenta || puedeActivosFijos || puedeDistribucion || puedeProductos || puedeVentasPresenciales || puedeVentas;

  const puedeVoluntariado = tienePermiso(roles, "ver_solicitudes_voluntariado") || tienePermiso(roles, "administrar_solicitudes_voluntariado");
  const puedeVisitas = tienePermiso(roles, "administrar_solicitudes_visitantes");
  const puedeDonacionesNecesidades =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "inactivar_donacion");
  const puedeDonacionesSolicitudes =
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "administrar_solicitudes_donaciones");
  const puedeDonaciones =
    puedeDonacionesNecesidades || puedeDonacionesSolicitudes;
  const esAdminUsuario =
    roles.some((r) =>
      ["admin", "superadmin", "administrador", "superadministrador"].includes(
        String(r || "").toLowerCase(),
      ),
    ) || String(user?.role || "").toLowerCase() === "admin";
  const puedeDocumentacionDocumentos =
    esAdminUsuario ||
    tienePermiso(roles, "ver_documentacion_privada") ||
    tienePermiso(roles, "crear_documentacion") ||
    tienePermiso(roles, "actualizar_documentacion");
  const puedeDocumentacionSolicitudes =
    esAdminUsuario ||
    tienePermiso(roles, "administrar_solicitudes_documentacion");
  const puedeDocumentacionAdministrativa = esAdminUsuario;
  const puedeDocumentacion =
    puedeDocumentacionDocumentos ||
    puedeDocumentacionSolicitudes ||
    puedeDocumentacionAdministrativa;
  const puedeFacturas =
    esAdminUsuario ||
    tienePermiso(roles, "ver_todas_las_facturas") ||
    tienePermiso(roles, "ver_ventas") ||
    tienePermiso(roles, "descargar_facturas");
  const puedeUsuarios = tienePermiso(roles, "editar_usuarios") || tienePermiso(roles, "crear_usuarios") || tienePermiso(roles, "gestionar_asignaciones_puntos");
  const puedeAjustes = tienePermiso(roles, "administrar_roles_permisos");
  const puedeAuditoria = tienePermiso(roles, "ver_auditoria");
  const puedePropuestas = tienePermiso(roles, "administrar_solicitudes_productores");
  const puedeMisPropuestas = tienePermiso(roles, "ingresar_propuesta_productor") || tienePermiso(roles, "ver_solicitudes_propias");
  const puedePerfil = tienePermiso(roles, "ver_perfil_propio");
  const puedeMisCompras = tienePermiso(roles, "ver_historial_compras_propio");
  const puedeMisSolicitudes =
    tienePermiso(roles, "ver_solicitudes_propias") ||
    tienePermiso(roles, "hacer_solicitud_donacion") ||
    tienePermiso(roles, "ingresar_solicitud_voluntariado") ||
    tienePermiso(roles, "crear_solicitud_visitante");
  const puedeMiCuenta = puedePerfil || puedeMisCompras || puedeMisSolicitudes || puedeMisPropuestas;

  const [busqueda, setBusqueda] = useState("");
  const tBuscarMenu = useTraducir("Buscar en el menú");
  const tLimpiarBusqueda = useTraducir("Limpiar búsqueda");
  const enlacesBuscables = [
    { to: "/admin/informacion-pagina-principal", etiqueta: "Información página principal", grupo: "Configuración general del sitio", icono: Info, ver: puedeCms },
    { to: "/admin/sobre-nosotros", etiqueta: "Historia", grupo: "Sobre nosotros", icono: Landmark, ver: puedeCms },
    { to: "/admin/historia-completa", etiqueta: "Historia completa", grupo: "Sobre nosotros", icono: ScrollText, ver: puedeCms },
    { to: "/admin/galeria", etiqueta: "Galería", grupo: "Sobre nosotros", icono: Image, ver: puedeGaleria },
    { to: "/admin/equipo", etiqueta: "Equipo", grupo: "Sobre nosotros", icono: Users, ver: puedeCms },
    { to: "/admin/producto", etiqueta: "Producto", grupo: "Manejo de inventario", icono: Box, ver: puedeProductos },
    { to: "/admin/puntos-venta", etiqueta: "Puntos de venta", grupo: "Manejo de inventario", icono: Store, ver: puedePuntosVenta },
    { to: "/admin/activos-fijos", etiqueta: "Activos fijos", grupo: "Manejo de inventario", icono: Wrench, ver: puedeActivosFijos },
    { to: "/admin/distribucion", etiqueta: "Distribución", grupo: "Manejo de inventario", icono: Truck, ver: puedeDistribucion },
    { to: "/admin/salidas-inventario", etiqueta: "Salidas de bodega", grupo: "Manejo de inventario", icono: PackageMinus, ver: puedeSalidasBodega },
    { to: "/admin/historial-movimientos", etiqueta: "Historial de movimientos", grupo: "Manejo de inventario", icono: History, ver: puedeInventario },
    { to: "/admin/ventas-presenciales", etiqueta: "Ventas presenciales", grupo: "Manejo de inventario", icono: ShoppingBag, ver: puedeVentasPresenciales },
    { to: "/admin/ventas-pendientes", etiqueta: "Ventas pendientes", grupo: "Manejo de inventario", icono: ClipboardCheck, ver: puedeVentas },
    { to: "/admin/historial-ventas", etiqueta: "Historial de ventas", grupo: "Manejo de inventario", icono: Receipt, ver: puedeVentas },
    { to: "/admin/voluntariado", etiqueta: "Voluntariado", grupo: "Voluntariado", icono: HandHeart, ver: puedeVoluntariado },
    { to: "/admin/voluntariado", search: { tab: "fechas" }, etiqueta: "Fechas disponibles", grupo: "Voluntariado", icono: CalendarDays, ver: puedeVoluntariado },
    { to: "/admin/visitas", etiqueta: "Visitas grupales", grupo: "Visitas grupales", icono: Users, ver: puedeVisitas },
    { to: "/admin/visitas", search: { tab: "fechas" }, etiqueta: "Fechas disponibles", grupo: "Visitas grupales", icono: CalendarDays, ver: puedeVisitas },
    { to: "/admin/donaciones/necesidades", etiqueta: "Necesidades de donación", grupo: "Donaciones", icono: HandCoins, ver: puedeDonacionesNecesidades },
    { to: "/admin/donaciones/solicitudes", etiqueta: "Solicitudes de donación", grupo: "Donaciones", icono: HandCoins, ver: puedeDonacionesSolicitudes },
    { to: "/admin/donaciones/fechas-recepcion", etiqueta: "Fechas de recepción", grupo: "Donaciones", icono: CalendarClock, ver: puedeDonacionesSolicitudes },
    { to: "/admin/documentacion", etiqueta: "Documentos", grupo: "Documentación", icono: BookOpenText, ver: puedeDocumentacionDocumentos },
    { to: "/admin/documentacion/solicitudes", etiqueta: "Solicitudes", grupo: "Documentación", icono: ScrollText, ver: puedeDocumentacionSolicitudes },
    { to: "/admin/documentacion/administrativa", etiqueta: "Documentación Administrativa", grupo: "Documentación", icono: ShieldCheck, ver: puedeDocumentacionAdministrativa },
    { to: "/admin/facturas", etiqueta: "Facturación", grupo: "Facturas", icono: Receipt, ver: puedeFacturas },
    { to: "/admin/usuarios", etiqueta: "Administrar usuarios", grupo: "Usuarios", icono: Users, ver: puedeUsuarios },
    { to: "/admin/ajustes/horarios", etiqueta: "Horarios", grupo: "Ajustes del sistema", icono: CalendarClock, ver: puedeAjustes },
    { to: "/admin/ajustes/permisos", etiqueta: "Permisos", grupo: "Ajustes del sistema", icono: Shield, ver: puedeAjustes },
    { to: "/admin/ajustes/catalogos", etiqueta: "Catálogos", grupo: "Ajustes del sistema", icono: ListChecks, ver: puedeAjustes },
    { to: "/admin/ajustes/manual", etiqueta: "Ayuda", grupo: "Ajustes del sistema", extra: "manual guía help guide", icono: LifeBuoy, ver: true },
    { to: "/admin/propuestas", etiqueta: "Propuestas de productores", grupo: "Productores", icono: Sprout, ver: puedePropuestas },
    { to: "/admin/auditoria", etiqueta: "Auditoría", grupo: "Auditoría", icono: ScrollText, ver: puedeAuditoria },
    { to: "/admin/perfil", etiqueta: "Mi perfil", grupo: "Mi cuenta", icono: UserRound, ver: puedePerfil },
    { to: "/admin/mis-compras", etiqueta: "Mis compras", grupo: "Mi cuenta", icono: ShoppingBag, ver: puedeMisCompras },
    { to: "/admin/mis-solicitudes", etiqueta: "Mis solicitudes", grupo: "Mi cuenta", icono: ClipboardList, ver: puedeMisSolicitudes },
    { to: "/admin/mis-propuestas", etiqueta: "Mis propuestas", grupo: "Mi cuenta", icono: Sprout, ver: puedeMisPropuestas },
  ];
  const consulta = claveBusqueda(busqueda.trim());
  const resultadosBusqueda = consulta
    ? enlacesBuscables.filter((enlace) => {
        if (!enlace.ver) return false;
        const textos = [enlace.etiqueta, enlace.grupo, enlace.extra, traducirSync(enlace.etiqueta), traducirSync(enlace.grupo)];
        return claveBusqueda(textos.join(" ")).includes(consulta);
      })
    : [];

  const avatarUrl = user?.fotoPerfilUrl?.trim()
    ? normalizeImageUrl(user.fotoPerfilUrl.trim(), { width: 96 })
    : "";
  const [avatarRoto, setAvatarRoto] = useState(false);
  const inicialAvatar = inicialDeNombre(displayName);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const onBrandClick = useHomeBrandNavigation();

  useEffect(() => {
    setAvatarRoto(false);
  }, [avatarUrl]);

  const isGeneralRoute =
    pathname === "/admin/informacion-pagina-principal" ||
    pathname === "/admin/sobre-nosotros" ||
    pathname === "/admin/galeria" ||
    pathname === "/admin/equipo" ||
    pathname === "/admin/historia-completa";
  const isSobreNosotrosRoute =
    pathname === "/admin/sobre-nosotros" ||
    pathname === "/admin/historia-completa" ||
    pathname === "/admin/galeria" ||
    pathname === "/admin/equipo";
  const isInventoryRoute =
    pathname === "/admin/producto" ||
    pathname === "/admin/puntos-venta" ||
    pathname === "/admin/activos-fijos" ||
    pathname === "/admin/distribucion" ||
    pathname === "/admin/ventas-presenciales" ||
    pathname === "/admin/historial-ventas" ||
    pathname === "/admin/ventas-pendientes" ||
    pathname === "/admin/salidas-inventario" ||
    (pathname.startsWith("/admin/puntos-venta/") && pathname.includes("/ventas")) ||
    pathname === "/admin/historial-movimientos";
  const isAjustesRoute =
    pathname === "/admin/ajustes" ||
    pathname.startsWith("/admin/ajustes/");
  const isVoluntariadoRoute = pathname === "/admin/voluntariado";
  const isVisitasRoute = pathname === "/admin/visitas";
  const isDonacionesRoute = pathname.startsWith("/admin/donaciones/");
  const isDocumentacionRoute = pathname.startsWith("/admin/documentacion");
  const isMiCuentaRoute =
    pathname === "/admin/perfil" ||
    pathname === "/admin/mis-compras" ||
    pathname === "/admin/mis-solicitudes" ||
    pathname.startsWith("/admin/mis-propuestas");

  const [generalOpen, setGeneralOpen] = useState(() => {
    const savedValue = localStorage.getItem(GENERAL_OPEN_KEY);
    return savedValue === null ? isGeneralRoute : savedValue === "true";
  });
  const [sobreNosotrosOpen, setSobreNosotrosOpen] = useState(() => {
    const savedValue = localStorage.getItem(SOBRE_NOSOTROS_OPEN_KEY);
    return savedValue === null ? isSobreNosotrosRoute : savedValue === "true";
  });
  const [inventoryOpen, setInventoryOpen] = useState(() => {
    const savedValue = localStorage.getItem(INVENTORY_OPEN_KEY);
    return savedValue === null ? isInventoryRoute : savedValue === "true";
  });
  const [voluntariadoOpen, setVoluntariadoOpen] = useState(() => {
    const savedValue = localStorage.getItem(VOLUNTARIADO_OPEN_KEY);
    return savedValue === null ? isVoluntariadoRoute : savedValue === "true";
  });
  const [visitasOpen, setVisitasOpen] = useState(() => {
    const savedValue = localStorage.getItem(VISITAS_OPEN_KEY);
    return savedValue === null ? isVisitasRoute : savedValue === "true";
  });
  const [donacionesOpen, setDonacionesOpen] = useState(() => {
    const savedValue = localStorage.getItem(DONACIONES_OPEN_KEY);
    return savedValue === null ? isDonacionesRoute : savedValue === "true";
  });
  const [documentacionOpen, setDocumentacionOpen] = useState(() => {
    const savedValue = localStorage.getItem(DOCUMENTACION_OPEN_KEY);
    return savedValue === null ? isDocumentacionRoute : savedValue === "true";
  });
  const [ajustesOpen, setAjustesOpen] = useState(() => {
    const savedValue = localStorage.getItem(AJUSTES_OPEN_KEY);
    return savedValue === null ? isAjustesRoute : savedValue === "true";
  });
  const [miCuentaOpen, setMiCuentaOpen] = useState(() => {
    const savedValue = localStorage.getItem(MI_CUENTA_OPEN_KEY);
    return savedValue === null ? isMiCuentaRoute : savedValue === "true";
  });
  const [logoUrl, setLogoUrl] = useState(() => readBrandLogos().logoUrl);
  const [logoClaroUrl, setLogoClaroUrl] = useState(() => readBrandLogos().logoClaroUrl);
  const [temaOscuro, setTemaOscuro] = useState(() => isAdminThemeDark());
  const logoActivo = temaOscuro
    ? (logoClaroUrl || LOGO_CLARO_FALLBACK)
    : (logoUrl || LOGO_OSCURO_FALLBACK || logoClaroUrl);

  const deferSet = (setter, key, open) => {
    queueMicrotask(() => {
      setter((prev) => {
        if (prev === open) return prev;
        if (key) localStorage.setItem(key, String(open));
        return open;
      });
    });
  };

  const updateGeneralOpen = (open) => deferSet(setGeneralOpen, GENERAL_OPEN_KEY, open);
  const updateSobreNosotrosOpen = (open) => deferSet(setSobreNosotrosOpen, SOBRE_NOSOTROS_OPEN_KEY, open);
  const updateInventoryOpen = (open) => deferSet(setInventoryOpen, INVENTORY_OPEN_KEY, open);
  const updateVoluntariadoOpen = (open) => deferSet(setVoluntariadoOpen, VOLUNTARIADO_OPEN_KEY, open);
  const updateVisitasOpen = (open) => deferSet(setVisitasOpen, VISITAS_OPEN_KEY, open);
  const updateDonacionesOpen = (open) => deferSet(setDonacionesOpen, DONACIONES_OPEN_KEY, open);
  const updateDocumentacionOpen = (open) => deferSet(setDocumentacionOpen, DOCUMENTACION_OPEN_KEY, open);
  const updateAjustesOpen = (open) => deferSet(setAjustesOpen, AJUSTES_OPEN_KEY, open);
  const updateMiCuentaOpen = (open) => deferSet(setMiCuentaOpen, MI_CUENTA_OPEN_KEY, open);

  useEffect(() => {
    const syncUser = () => setUser(getActiveSessionUser());
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener(SESSION_UPDATED_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(SESSION_UPDATED_EVENT, syncUser);
    };
  }, []);

  useEffect(() => {
    const current = getActiveSessionUser();
    if (!current?.id) return undefined;

    let activo = true;
    const timeoutId = window.setTimeout(() => {
      obtenerPerfil()
        .then((perfil) => {
          if (!activo || !perfil || !getStoredUser()) return;
          const updated = applyPerfilToSession(perfil);
          if (updated) setUser(updated);
        })
        .catch(() => {});
    }, 400);

    return () => {
      activo = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  useEffect(() => {
    if (isSobreNosotrosRoute) {
      setSobreNosotrosOpen(true);
      localStorage.setItem(SOBRE_NOSOTROS_OPEN_KEY, "true");
      setGeneralOpen(true);
      localStorage.setItem(GENERAL_OPEN_KEY, "true");
    }
  }, [isSobreNosotrosRoute]);

  useEffect(() => {
    if (isAjustesRoute) {
      setAjustesOpen(true);
      localStorage.setItem(AJUSTES_OPEN_KEY, "true");
    }
  }, [isAjustesRoute]);

  useEffect(() => {
    if (isVoluntariadoRoute) {
      setVoluntariadoOpen(true);
      localStorage.setItem(VOLUNTARIADO_OPEN_KEY, "true");
    }
  }, [isVoluntariadoRoute]);

  useEffect(() => {
    if (isVisitasRoute) {
      setVisitasOpen(true);
      localStorage.setItem(VISITAS_OPEN_KEY, "true");
    }
  }, [isVisitasRoute]);

  useEffect(() => {
    if (isDonacionesRoute) {
      setDonacionesOpen(true);
      localStorage.setItem(DONACIONES_OPEN_KEY, "true");
    }
  }, [isDonacionesRoute]);

  useEffect(() => {
    if (isDocumentacionRoute) {
      setDocumentacionOpen(true);
      localStorage.setItem(DOCUMENTACION_OPEN_KEY, "true");
    }
  }, [isDocumentacionRoute]);

  useEffect(() => {
    if (isMiCuentaRoute) {
      setMiCuentaOpen(true);
      localStorage.setItem(MI_CUENTA_OPEN_KEY, "true");
    }
  }, [isMiCuentaRoute]);

  useEffect(() => {
    let activo = true;

    obtenerNavbar()
      .then((navbar) => {
        if (!activo) return;
        const nextLogoUrl = typeof navbar?.logoUrl === "string" ? navbar.logoUrl.trim() : "";
        const nextLogoClaroUrl =
          typeof navbar?.logoClaroUrl === "string" ? navbar.logoClaroUrl.trim() : "";
        setLogoUrl(nextLogoUrl);
        setLogoClaroUrl(nextLogoClaroUrl);
        cacheBrandLogos({ logoUrl: nextLogoUrl, logoClaroUrl: nextLogoClaroUrl });
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const syncTema = () => setTemaOscuro(isAdminThemeDark());
    syncTema();
    window.addEventListener(ADMIN_THEME_CHANGED_EVENT, syncTema);
    return () => window.removeEventListener(ADMIN_THEME_CHANGED_EVENT, syncTema);
  }, []);

  const closeMobileSidebar = () => setOpenMobile(false);

  const clearSidebarState = () => {
    localStorage.removeItem(GENERAL_OPEN_KEY);
    localStorage.removeItem(INVENTORY_OPEN_KEY);
    localStorage.removeItem(VOLUNTARIADO_OPEN_KEY);
    localStorage.removeItem(VISITAS_OPEN_KEY);
    localStorage.removeItem(DONACIONES_OPEN_KEY);
    localStorage.removeItem(DOCUMENTACION_OPEN_KEY);
    localStorage.removeItem(MI_CUENTA_OPEN_KEY);
    localStorage.removeItem(FORMULARIOS_OPEN_KEY);
    localStorage.removeItem(SOBRE_NOSOTROS_OPEN_KEY);
    localStorage.removeItem(AJUSTES_OPEN_KEY);
  };

  const handleLogout = async () => {
    beginLogout();
    cancelPendingSessionRefresh();
    await soltarCarritoAlCerrarSesion();
    clearSidebarState();
    clearPerfilCache();
    setUser(null);
    clearSession();
    window.location.replace("/");
  };

  return (
    <Sidebar collapsible="icon" className="bg-white dark:bg-slate-950 !rounded-none">
      <SidebarHeader>
        <Link
          to="/"
          className="block group-data-[state=collapsed]/sidebar:flex group-data-[state=collapsed]/sidebar:justify-center"
          title="Ir al inicio"
          aria-label={"Ir al inicio de Caf\u00e9 UNA"}
          onClick={(event) => {
            closeMobileSidebar();
            onBrandClick(event);
          }}
        >
          {logoActivo ? (
            <img
              src={normalizeImageUrl(logoActivo, { width: 320 })}
              alt={"Caf\u00e9 UNA"}
              className="h-[52px] w-auto max-w-[10rem] object-contain group-data-[state=collapsed]/sidebar:h-8 group-data-[state=collapsed]/sidebar:max-w-10"
            />
          ) : (
            <span className="text-[length:var(--text-subtitle)] font-bold text-slate-900 dark:text-slate-100 group-data-[state=collapsed]/sidebar:text-[length:var(--text-body)]">
              {"Caf\u00e9 UNA"}
            </span>
          )}
        </Link>
        <label className="relative mt-3 block group-data-[state=collapsed]/sidebar:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setBusqueda("");
            }}
            placeholder={tBuscarMenu}
            aria-label={tBuscarMenu}
            className="h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-white pl-9 pr-10 text-[length:var(--text-body)] text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label={tLimpiarBusqueda}
              title={tLimpiarBusqueda}
              className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>
      </SidebarHeader>

      <SidebarContent scrollKey="admin">
        {consulta ? (
          <SidebarGroup>
            {resultadosBusqueda.length ? (
              <SidebarMenu>
                {resultadosBusqueda.map((enlace) => {
                  const Icono = enlace.icono;
                  return (
                    <SidebarMenuItem key={`${enlace.to}-${enlace.etiqueta}`}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={enlace.to}
                          search={enlace.search}
                          activeProps={linkActivo}
                          onClick={() => {
                            setBusqueda("");
                            closeMobileSidebar();
                          }}
                        >
                          <Icono />
                          <span className="truncate"><ST>{enlace.etiqueta}</ST></span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            ) : (
              <p className="px-2 py-3 text-[length:var(--text-body)] text-slate-500">
                <ST>No hay opciones con esa búsqueda.</ST>
              </p>
            )}
          </SidebarGroup>
        ) : null}
        <div className={consulta ? "hidden" : "contents"}>
        {puedeVerCmsGrupo ? (
        <Collapsible.Root
          open={generalOpen}
          onOpenChange={updateGeneralOpen}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <Settings />
                <span className="truncate"><ST>Configuración general del sitio</ST></span>
                <ChevronDown className="ml-auto shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {puedeCms ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/informacion-pagina-principal" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Info />
                        <span className="truncate"><ST>Información página principal</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeCms || puedeGaleria ? (
                  <SidebarMenuSubItem>
                    <Collapsible.Root
                      open={sobreNosotrosOpen}
                      onOpenChange={updateSobreNosotrosOpen}
                      className="group/sobre"
                    >
                      <Collapsible.Trigger
                        type="button"
                        className="flex h-8 w-full items-center gap-2 px-2 text-left text-sm text-slate-600 transition-colors hover:bg-transparent hover:text-slate-950 focus-visible:outline-none dark:text-slate-300 dark:hover:text-white [&_svg]:size-4 [&_svg]:shrink-0"
                      >
                        <BookOpenText />
                        <span><ST>Sobre nosotros</ST></span>
                        <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/sobre:rotate-180" />
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <SidebarMenuSub className="mt-1">
                          {puedeCms ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <Link to="/admin/sobre-nosotros" activeProps={linkActivo} onClick={closeMobileSidebar}>
                                <Landmark />
                                <span><ST>Historia</ST></span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          ) : null}
                          {puedeCms ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <Link to="/admin/historia-completa" activeProps={linkActivo} onClick={closeMobileSidebar}>
                                <ScrollText />
                                <span><ST>Historia completa</ST></span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          ) : null}
                          {puedeGaleria ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <Link to="/admin/galeria" activeProps={linkActivo} onClick={closeMobileSidebar}>
                                <Image />
                                <span><ST>Galería</ST></span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          ) : null}
                          {puedeCms ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <Link to="/admin/equipo" activeProps={linkActivo} onClick={closeMobileSidebar}>
                                <Users />
                                <span><ST>Equipo</ST></span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          ) : null}
                        </SidebarMenuSub>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  </SidebarMenuSubItem>
                  ) : null}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeVerInventarioGrupo ? (
        <Collapsible.Root
          open={inventoryOpen}
          onOpenChange={updateInventoryOpen}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <Package />
                <span><ST>Manejo de inventario</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {puedeProductos ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/producto" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Box />
                        <span><ST>Producto</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedePuntosVenta ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/puntos-venta" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Store />
                        <span><ST>Puntos de venta</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeActivosFijos ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/activos-fijos" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Wrench />
                        <span><ST>Activos fijos</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeDistribucion ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/distribucion" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Truck />
                        <span><ST>Distribución</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeSalidasBodega ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/salidas-inventario" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <PackageMinus />
                        <span><ST>Salidas de bodega</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeInventario ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/historial-movimientos" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <History />
                        <span><ST>Historial de movimientos</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeVentasPresenciales ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/ventas-presenciales" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ShoppingBag />
                        <span><ST>Ventas presenciales</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeVentas ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/ventas-pendientes" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ClipboardCheck />
                        <span><ST>Ventas pendientes</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeVentas ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/historial-ventas" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Receipt />
                        <span><ST>Historial de ventas</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeVoluntariado ? (
        <Collapsible.Root
          open={voluntariadoOpen}
          onOpenChange={updateVoluntariadoOpen}
          className="group/voluntariado"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <HandHeart />
                <span><ST>Voluntariado</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/voluntariado:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/voluntariado" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <HandHeart />
                        <span><ST>Voluntariado</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link
                        to="/admin/voluntariado"
                        search={{ tab: "fechas" }}
                        activeProps={linkActivo}
                        onClick={closeMobileSidebar}
                      >
                        <CalendarDays />
                        <span><ST>Fechas disponibles</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeVisitas ? (
        <Collapsible.Root
          open={visitasOpen}
          onOpenChange={updateVisitasOpen}
          className="group/visitas"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <Users />
                <span><ST>Visitas grupales</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/visitas:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/visitas" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Users />
                        <span><ST>Visitas grupales</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link
                        to="/admin/visitas"
                        search={{ tab: "fechas" }}
                        activeProps={linkActivo}
                        onClick={closeMobileSidebar}
                      >
                        <CalendarDays />
                        <span><ST>Fechas disponibles</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeDonaciones ? (
        <Collapsible.Root
          open={donacionesOpen}
          onOpenChange={updateDonacionesOpen}
          className="group/donaciones"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <HandCoins />
                <span><ST>Donaciones</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/donaciones:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {puedeDonacionesNecesidades ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/donaciones/necesidades" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <HandCoins />
                        <span><ST>Necesidades de donación</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeDonacionesSolicitudes ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/donaciones/solicitudes" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <HandCoins />
                        <span><ST>Solicitudes de donación</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeDonacionesSolicitudes ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/donaciones/fechas-recepcion" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <CalendarClock />
                        <span><ST>Fechas de recepción</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeDocumentacion ? (
        <Collapsible.Root
          open={documentacionOpen}
          onOpenChange={updateDocumentacionOpen}
          className="group/documentacion"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <BookOpenText />
                <span><ST>Documentación</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/documentacion:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {puedeDocumentacionDocumentos ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/documentacion" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <BookOpenText />
                        <span><ST>Documentos</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeDocumentacionSolicitudes ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/documentacion/solicitudes" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ScrollText />
                        <span><ST>Solicitudes</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeDocumentacionAdministrativa ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/documentacion/administrativa" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ShieldCheck />
                        <span><ST>Documentación Administrativa</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeFacturas ? (
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/facturas" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <Receipt />
                  <span><ST>Facturación</ST></span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarMenu>
            {puedeUsuarios ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/usuarios" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <Users />
                  <span><ST>Administrar usuarios</ST></span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
            <Collapsible.Root
              open={ajustesOpen}
              onOpenChange={updateAjustesOpen}
              className="group/ajustes"
            >
              <SidebarMenuItem>
                <Collapsible.Trigger
                  type="button"
                  className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-slate-600 transition-colors hover:bg-transparent hover:text-slate-950 focus-visible:outline-none dark:text-slate-300 dark:hover:text-white [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <Wrench />
                  <span className="truncate"><ST>Ajustes del sistema</ST></span>
                  <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/ajustes:rotate-180" />
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <SidebarMenuSub className="mt-1">
                    {puedeAjustes ? (
                    <>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/admin/ajustes/horarios" activeProps={linkActivo} onClick={closeMobileSidebar}>
                          <CalendarClock />
                          <span><ST>Horarios</ST></span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/admin/ajustes/permisos" activeProps={linkActivo} onClick={closeMobileSidebar}>
                          <Shield />
                          <span><ST>Permisos</ST></span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/admin/ajustes/catalogos" activeProps={linkActivo} onClick={closeMobileSidebar}>
                          <ListChecks />
                          <span><ST>{"Cat\u00e1logos"}</ST></span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    </>
                    ) : null}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/admin/ajustes/manual" activeProps={linkActivo} onClick={closeMobileSidebar}>
                          <LifeBuoy />
                          <span><ST>Ayuda</ST></span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </Collapsible.Content>
              </SidebarMenuItem>
            </Collapsible.Root>
            {puedePropuestas ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/propuestas" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <Sprout />
                  <span><ST>Propuestas de productores</ST></span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
            {puedeAuditoria ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/auditoria" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <ScrollText />
                  <span><ST>{"Auditor\u00eda"}</ST></span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>

        {puedeMiCuenta ? (
        <Collapsible.Root
          open={miCuentaOpen}
          onOpenChange={updateMiCuentaOpen}
          className="group/mi-cuenta"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <UserRound />
                <span><ST>Mi cuenta</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/mi-cuenta:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {puedePerfil ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/perfil" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <UserRound />
                        <span><ST>Mi perfil</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeMisCompras ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/mis-compras" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ShoppingBag />
                        <span><ST>Mis compras</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeMisSolicitudes ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/mis-solicitudes" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ClipboardList />
                        <span><ST>Mis solicitudes</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                  {puedeMisPropuestas ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/mis-propuestas" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Sprout />
                        <span><ST>Mis propuestas</ST></span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  ) : null}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}
        </div>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-transparent hover:text-slate-950 dark:text-slate-200 dark:hover:text-white group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
            >
              {avatarUrl && !avatarRoto ? (
                <img
                  key={avatarUrl}
                  src={avatarUrl}
                  alt=""
                  className="size-8 rounded-full object-cover"
                  style={{ objectPosition: getImageObjectPosition(user?.fotoPerfilPosicion) }}
                  onError={() => setAvatarRoto(true)}
                />
              ) : (
                <span
                  className="inline-flex size-8 items-center justify-center rounded-full bg-amber-900 text-[length:var(--text-body)] font-bold text-white"
                  aria-hidden="true"
                >
                  {inicialAvatar}
                </span>
              )}
              <span className="min-w-0 flex-1 text-left group-data-[state=collapsed]/sidebar:hidden">
                <span className="block truncate">{displayName}</span>
                {displayEmail ? <span className="block truncate text-xs font-normal text-slate-500">{displayEmail}</span> : null}
              </span>
              <ChevronDown className="size-4 shrink-0 group-data-[state=collapsed]/sidebar:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="z-[100] w-56">
            {puedePerfil ? (
              <DropdownMenuItem asChild>
                <Link to="/admin/perfil" className="cursor-pointer" activeProps={linkActivo}>
                  <UserRound className="size-4" />
                  <span><ST>Mi perfil</ST></span>
                </Link>
              </DropdownMenuItem>
            ) : null}
            {puedeMisCompras ? (
              <DropdownMenuItem asChild>
                <Link to="/admin/mis-compras" className="cursor-pointer" activeProps={linkActivo}>
                  <ShoppingBag className="size-4" />
                  <span><ST>Mis compras</ST></span>
                </Link>
              </DropdownMenuItem>
            ) : null}
            {puedeMisSolicitudes ? (
              <DropdownMenuItem asChild>
                <Link to="/admin/mis-solicitudes" className="cursor-pointer" activeProps={linkActivo}>
                  <ClipboardList className="size-4" />
                  <span><ST>Mis solicitudes</ST></span>
                </Link>
              </DropdownMenuItem>
            ) : null}
            {puedeMisPropuestas ? (
              <DropdownMenuItem asChild>
                <Link to="/admin/mis-propuestas" className="cursor-pointer" activeProps={linkActivo}>
                  <Sprout className="size-4" />
                  <span><ST>Mis propuestas</ST></span>
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="cursor-pointer text-red-600 hover:text-red-600 focus:text-red-700 data-[highlighted]:text-red-600"
              onSelect={(event) => {
                event.preventDefault();
                handleLogout();
              }}
            >
              <LogOut className="size-4" />
                <span><ST>Cerrar sesión</ST></span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
