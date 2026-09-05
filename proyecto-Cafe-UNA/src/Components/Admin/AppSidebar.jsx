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
  Receipt,
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
  HandCoins,
  ClipboardList,
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
import {
  applyPerfilToSession,
  beginLogout,
  clearSession,
  getActiveSessionUser,
  getStoredUser,
  SESSION_UPDATED_EVENT,
} from "../../services/sessionService";
import { ST } from "../T/ST";

const GENERAL_OPEN_KEY = "admin-sidebar-general-open";
const INVENTORY_OPEN_KEY = "admin-sidebar-inventory-open";
const FORMULARIOS_OPEN_KEY = "admin-sidebar-formularios-open";
const SOBRE_NOSOTROS_OPEN_KEY = "admin-sidebar-sobre-nosotros-open";
const AJUSTES_OPEN_KEY = "admin-sidebar-ajustes-open";
const linkActivo = {
  className: "text-slate-950",
};

export function AppSidebar() {
  const [user, setUser] = useState(() => getActiveSessionUser());
  const { setOpenMobile } = useSidebar();
  const displayName = user?.name || user?.username || "Usuario";
  const displayEmail = user?.email || user?.correo || "";
  const roles = rolesDeUsuario(user);
  const puedeCms = tienePermiso(roles, "actualizar_informacion");
  const puedeGaleria = tienePermiso(roles, "agregar_imagenes_galeria");
  const puedeVerCmsGrupo = puedeCms || puedeGaleria;

  const puedeInventario = tienePermiso(roles, "ver_inventario");
  const puedePuntosVenta = tienePermiso(roles, "ver_inventario") || tienePermiso(roles, "actualizar_inventario");
  const puedeActivosFijos = tienePermiso(roles, "ver_inventario") || tienePermiso(roles, "actualizar_inventario");
  const puedeDistribucion = tienePermiso(roles, "ver_inventario");
  const puedeProductos = tienePermiso(roles, "ver_productos") || tienePermiso(roles, "ver_inventario");
  const puedeVentasPresenciales =
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ajustar_stock_ubicaciones");
  const puedeVentas =
    tienePermiso(roles, "ver_ventas") ||
    tienePermiso(roles, "ver_historial_compras_clientes");
  const puedeVerInventarioGrupo =
    puedeInventario || puedePuntosVenta || puedeActivosFijos || puedeDistribucion || puedeProductos || puedeVentasPresenciales || puedeVentas;

  const puedeVoluntariado = tienePermiso(roles, "ver_solicitudes_voluntariado") || tienePermiso(roles, "administrar_solicitudes_voluntariado");
  const puedeDonacionesNecesidades =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "inactivar_donacion");
  const puedeDonacionesSolicitudes =
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "administrar_solicitudes_donaciones");
  const puedeVerFormulariosGrupo =
    puedeVoluntariado || puedeDonacionesNecesidades || puedeDonacionesSolicitudes;
  const puedeUsuarios = tienePermiso(roles, "editar_usuarios") || tienePermiso(roles, "crear_usuarios");
  const puedeAjustes = tienePermiso(roles, "administrar_roles_permisos");
  const puedeAuditoria = tienePermiso(roles, "ver_auditoria");
  const puedePerfil = tienePermiso(roles, "ver_perfil_propio");
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
    pathname === "/admin/galeria";
  const isSobreNosotrosRoute = pathname === "/admin/sobre-nosotros" || pathname === "/admin/galeria";
  const isInventoryRoute =
    pathname === "/admin/producto" ||
    pathname === "/admin/puntos-venta" ||
    pathname === "/admin/activos-fijos" ||
    pathname === "/admin/distribucion" ||
    pathname === "/admin/ventas-presenciales" ||
    pathname === "/admin/historial-ventas" ||
    pathname === "/admin/historial-movimientos";
  const isAjustesRoute =
    pathname === "/admin/ajustes" ||
    pathname.startsWith("/admin/ajustes/");
  const isFormulariosRoute =
    pathname === "/admin/voluntariado" ||
    pathname.startsWith("/admin/donaciones/");

  const [generalOpen, setGeneralOpen] = useState(() => {
    const savedValue = localStorage.getItem(GENERAL_OPEN_KEY);
    return savedValue === null ? isGeneralRoute : savedValue === "true";
  });
  const [sobreNosotrosOpen, setSobreNosotrosOpen] = useState(() => {
    const savedValue = localStorage.getItem(SOBRE_NOSOTROS_OPEN_KEY);
    return savedValue === null ? isSobreNosotrosRoute : savedValue === "true";
  });
  const [logoUrl, setLogoUrl] = useState("");

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
    if (isFormulariosRoute) {
      setFormulariosOpen(true);
      localStorage.setItem(FORMULARIOS_OPEN_KEY, "true");
    }
  }, [isFormulariosRoute]);

  useEffect(() => {
    let activo = true;

    obtenerNavbar()
      .then((navbar) => {
        if (!activo) return;
        setLogoUrl(typeof navbar?.logoUrl === "string" ? navbar.logoUrl.trim() : "");
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  const [inventoryOpen, setInventoryOpen] = useState(() => {
    const savedValue = localStorage.getItem(INVENTORY_OPEN_KEY);
    return savedValue === null ? isInventoryRoute : savedValue === "true";
  });
  const [formulariosOpen, setFormulariosOpen] = useState(() => {
    const savedValue = localStorage.getItem(FORMULARIOS_OPEN_KEY);
    return savedValue === null ? isFormulariosRoute : savedValue === "true";
  });
  const [ajustesOpen, setAjustesOpen] = useState(() => {
    const savedValue = localStorage.getItem(AJUSTES_OPEN_KEY);
    return savedValue === null ? isAjustesRoute : savedValue === "true";
  });

  const updateGeneralOpen = (open) => {
    setGeneralOpen(open);
    localStorage.setItem(GENERAL_OPEN_KEY, String(open));
  };

  const updateSobreNosotrosOpen = (open) => {
    setSobreNosotrosOpen(open);
    localStorage.setItem(SOBRE_NOSOTROS_OPEN_KEY, String(open));
  };

  const updateInventoryOpen = (open) => {
    setInventoryOpen(open);
    localStorage.setItem(INVENTORY_OPEN_KEY, String(open));
  };

  const updateFormulariosOpen = (open) => {
    setFormulariosOpen(open);
    localStorage.setItem(FORMULARIOS_OPEN_KEY, String(open));
  };

  const updateAjustesOpen = (open) => {
    setAjustesOpen(open);
    localStorage.setItem(AJUSTES_OPEN_KEY, String(open));
  };

  const closeMobileSidebar = () => setOpenMobile(false);

  const clearSidebarState = () => {
    localStorage.removeItem(GENERAL_OPEN_KEY);
    localStorage.removeItem(INVENTORY_OPEN_KEY);
    localStorage.removeItem(FORMULARIOS_OPEN_KEY);
    localStorage.removeItem(SOBRE_NOSOTROS_OPEN_KEY);
    localStorage.removeItem(AJUSTES_OPEN_KEY);
  };

  const handleLogout = () => {
    beginLogout();
    cancelPendingSessionRefresh();
    clearSidebarState();
    clearPerfilCache();
    setUser(null);
    clearSession();
    window.location.replace("/");
  };

  return (
    <Sidebar collapsible="icon" className="bg-white">
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
          {logoUrl ? (
            <img
              src={normalizeImageUrl(logoUrl, { width: 320 })}
              alt={"Caf\u00e9 UNA"}
              className="h-[52px] w-auto max-w-[10rem] object-contain group-data-[state=collapsed]/sidebar:h-8 group-data-[state=collapsed]/sidebar:max-w-10"
            />
          ) : (
            <span className="text-[length:var(--text-subtitle)] font-bold text-slate-900 group-data-[state=collapsed]/sidebar:text-[length:var(--text-body)]">
              {"Caf\u00e9 UNA"}
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
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
                        className="flex h-8 w-full items-center gap-2 px-2 text-left text-sm text-slate-600 transition-colors hover:bg-transparent hover:text-slate-950 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0"
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

        {puedeVerFormulariosGrupo ? (
        <Collapsible.Root
          open={formulariosOpen}
          onOpenChange={updateFormulariosOpen}
          className="group/formularios"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <ClipboardList />
                <span><ST>Formularios</ST></span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/formularios:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {puedeVoluntariado ? (
                  <>
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
                  </>
                  ) : null}
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
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
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
            {puedeAjustes ? (
            <Collapsible.Root
              open={ajustesOpen}
              onOpenChange={updateAjustesOpen}
              className="group/ajustes"
            >
              <SidebarMenuItem>
                <Collapsible.Trigger
                  type="button"
                  className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-slate-600 transition-colors hover:bg-transparent hover:text-slate-950 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <Wrench />
                  <span className="truncate"><ST>Ajustes del sistema</ST></span>
                  <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/ajustes:rotate-180" />
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <SidebarMenuSub className="mt-1">
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
                  </SidebarMenuSub>
                </Collapsible.Content>
              </SidebarMenuItem>
            </Collapsible.Root>
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
            {puedePerfil ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/perfil" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <UserRound />
                  <span><ST>Mi perfil</ST></span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-transparent hover:text-slate-950 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
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
            <div className="px-2 py-1.5 text-xs text-slate-500">
              <div className="truncate font-medium text-slate-700">{displayName}</div>
              {displayEmail ? <div className="truncate">{displayEmail}</div> : null}
            </div>
            <DropdownMenuItem asChild>
              <Link to="/admin/perfil" className="cursor-pointer" activeProps={linkActivo}>
                <UserRound className="size-4" />
                <span><ST>Mi perfil</ST></span>
              </Link>
            </DropdownMenuItem>
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
