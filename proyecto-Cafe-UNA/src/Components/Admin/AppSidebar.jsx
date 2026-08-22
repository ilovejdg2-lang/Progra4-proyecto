"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Box,
  ChevronDown,
  ClipboardList,
  HandHeart,
  Info,
  LogOut,
  Package,
  ScrollText,
  Settings,
  UserRound,
  Users,
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

const GENERAL_OPEN_KEY = "admin-sidebar-general-open";
const INVENTORY_OPEN_KEY = "admin-sidebar-inventory-open";
const linkActivo = {
  className: "text-slate-950",
};

export function AppSidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getActiveSessionUser());
  const { setOpenMobile } = useSidebar();
  const displayName = user?.name || user?.username || "Usuario";
  const displayEmail = user?.email || user?.correo || "";
  const roles = rolesDeUsuario(user);
  const puedeCms = tienePermiso(roles, "actualizar_informacion");
  const puedeInventario = tienePermiso(roles, "ver_inventario");
  const puedeVoluntariado = tienePermiso(roles, "ver_solicitudes_voluntariado");
  const puedeUsuarios = tienePermiso(roles, "editar_usuarios");
  const puedeAuditoria = tienePermiso(roles, "ver_auditoria");
  const puedePerfil = tienePermiso(roles, "ver_perfil_propio");
  const avatarUrl = user?.fotoPerfilUrl?.trim()
    ? normalizeImageUrl(user.fotoPerfilUrl.trim(), { width: 96 })
    : "";

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const onBrandClick = useHomeBrandNavigation();

  const isGeneralRoute =
    pathname === "/admin/informacion-pagina-principal" || pathname === "/admin/sobre-nosotros";
  const isInventoryRoute = pathname === "/admin/producto";

  const [generalOpen, setGeneralOpen] = useState(() => {
    const savedValue = localStorage.getItem(GENERAL_OPEN_KEY);
    return savedValue === null ? isGeneralRoute : savedValue === "true";
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

  const updateGeneralOpen = (open) => {
    setGeneralOpen(open);
    localStorage.setItem(GENERAL_OPEN_KEY, String(open));
  };

  const updateInventoryOpen = (open) => {
    setInventoryOpen(open);
    localStorage.setItem(INVENTORY_OPEN_KEY, String(open));
  };

  const closeMobileSidebar = () => setOpenMobile(false);

  const clearSidebarState = () => {
    localStorage.removeItem(GENERAL_OPEN_KEY);
    localStorage.removeItem(INVENTORY_OPEN_KEY);
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
    <Sidebar collapsible="offcanvas" className="bg-white">
      <SidebarHeader>
        <Link
          to="/"
          className="block"
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
              className="h-8 w-auto"
            />
          ) : (
            <span className="text-sm font-bold text-slate-900">{"Caf\u00e9 UNA"}</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {puedeCms ? (
        <Collapsible.Root
          open={generalOpen}
          onOpenChange={updateGeneralOpen}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <Settings />
                <span>{"Configuraci\u00f3n general del sitio"}</span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/informacion-pagina-principal" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Info />
                        <span>{"Informaci\u00f3n p\u00e1gina principal"}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/sobre-nosotros" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <ClipboardList />
                        <span>Sobre nosotros</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        {puedeInventario ? (
        <Collapsible.Root
          open={inventoryOpen}
          onOpenChange={updateInventoryOpen}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <Collapsible.Trigger type="button">
                <Package />
                <span>Manejo de inventario</span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/producto" activeProps={linkActivo} onClick={closeMobileSidebar}>
                        <Box />
                        <span>Producto</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
        ) : null}

        <SidebarGroup>
          <SidebarMenu>
            {puedeVoluntariado ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/voluntariado" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <HandHeart />
                  <span>Administrar voluntariado</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
            {puedeUsuarios ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/usuarios" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <Users />
                  <span>Administrar usuarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
            {puedeAuditoria ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/auditoria" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <ScrollText />
                  <span>{"Auditor\u00eda"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            ) : null}
            {puedePerfil ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/perfil" activeProps={linkActivo} onClick={closeMobileSidebar}>
                  <UserRound />
                  <span>Mi perfil</span>
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
              className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-transparent hover:text-slate-950"
            >
              {avatarUrl ? (
                <img
                  key={avatarUrl}
                  src={avatarUrl}
                  alt=""
                  className="size-8 rounded-full object-cover"
                  style={{ objectPosition: getImageObjectPosition(user?.fotoPerfilPosicion) }}
                />
              ) : (
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate">{displayName}</span>
                {displayEmail ? <span className="block truncate text-xs font-normal text-slate-500">{displayEmail}</span> : null}
              </span>
              <ChevronDown className="size-4 shrink-0" />
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
                <span>Mi perfil</span>
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
              <span>{"Cerrar sesi\u00f3n"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
