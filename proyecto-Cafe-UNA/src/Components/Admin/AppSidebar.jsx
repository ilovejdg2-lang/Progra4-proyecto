"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Box,
  ChevronDown,
  ClipboardList,
  HandHeart,
  Info,
  LogOut,
  Package,
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
import { obtenerNavbar } from "../../services/informacionService";
import { obtenerPerfil } from "../../services/perfilService";
import {
  applyPerfilToSession,
  clearSession,
  getActiveSessionUser,
  SESSION_UPDATED_EVENT,
} from "../../services/sessionService";

const GENERAL_OPEN_KEY = "admin-sidebar-general-open";
const INVENTORY_OPEN_KEY = "admin-sidebar-inventory-open";

export function AppSidebar() {
  const [user, setUser] = useState(() => getActiveSessionUser());
  const { setOpenMobile } = useSidebar();
  const displayName = user?.name || user?.username || "Usuario";
  const displayEmail = user?.email || user?.correo || "";
  const avatarUrl = user?.fotoPerfilUrl?.trim()
    ? normalizeImageUrl(user.fotoPerfilUrl.trim(), { width: 96 })
    : "";

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

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

    obtenerPerfil()
      .then((perfil) => {
        if (!activo || !perfil) return;
        const updated = applyPerfilToSession(perfil);
        if (updated) setUser(updated);
      })
      .catch(() => {});

    return () => {
      activo = false;
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
    clearSidebarState();
    clearSession();
    window.location.href = "/";
  };

  return (
    <Sidebar collapsible="offcanvas" className="bg-white">
      <SidebarHeader>
        <Link
          to="/"
          className="block"
          title="Ir al inicio"
          aria-label="Ir al inicio de Café UNA"
          onClick={() => {
            closeMobileSidebar();
          }}
        >
          {logoUrl ? (
            <img
              src={normalizeImageUrl(logoUrl, { width: 320 })}
              alt="Café UNA"
              className="h-8 w-auto"
            />
          ) : (
            <span className="text-sm font-bold text-slate-900">Café UNA</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
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
                      <Link to="/admin/informacion-pagina-principal" onClick={closeMobileSidebar}>
                        <Info />
                        <span>{"Informaci\u00f3n pagina principal"}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/sobre-nosotros" onClick={closeMobileSidebar}>
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
                      <Link to="/admin/producto" onClick={closeMobileSidebar}>
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

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/voluntariado" onClick={closeMobileSidebar}>
                  <HandHeart />
                  <span>Administrar voluntariado</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/usuarios" onClick={closeMobileSidebar}>
                  <Users />
                  <span>Administrar usuarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/perfil" onClick={closeMobileSidebar}>
                  <UserRound />
                  <span>Mi perfil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
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
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs text-slate-500">
              <div className="truncate font-medium text-slate-700">{displayName}</div>
              {displayEmail ? <div className="truncate">{displayEmail}</div> : null}
            </div>
            <DropdownMenuItem asChild>
              <Link to="/admin/perfil" className="cursor-pointer">
                <UserRound className="size-4" />
                <span>Mi perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-700">
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
