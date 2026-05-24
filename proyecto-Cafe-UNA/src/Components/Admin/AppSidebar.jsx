"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Box,
  ChevronDown,
  ClipboardList,
  HandHeart,
  Info,
  LogOut,
  Package,
  Settings,
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
} from "./ui/Sidebar";

const GENERAL_OPEN_KEY = "admin-sidebar-general-open";
const INVENTORY_OPEN_KEY = "admin-sidebar-inventory-open";

export function AppSidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const displayName = user?.username?.includes("@") ? user?.name : user?.username || user?.name || "Usuario";
  const displayEmail = user?.email || user?.correo || "";

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

  const clearSidebarState = () => {
    localStorage.removeItem(GENERAL_OPEN_KEY);
    localStorage.removeItem(INVENTORY_OPEN_KEY);
  };

  const handleLogout = () => {
    clearSidebarState();
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/";
  };

  return (
    <Sidebar collapsible="offcanvas" className="bg-white">
      <SidebarHeader>
        <Link
          to="/"
          className="block"
          onClick={clearSidebarState}
        >
          <img src="/logo.webp" alt="Café UNA" className="h-10 w-auto object-contain" />
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
                      <Link to="/admin/informacion-pagina-principal">
                        <Info />
                        <span>{"Informaci\u00f3n pagina principal"}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/admin/sobre-nosotros">
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
                      <Link to="/admin/producto">
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
                <Link to="/admin/voluntariado">
                  <HandHeart />
                  <span>Administrar voluntariado</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/usuarios">
                  <Users />
                  <span>Administrar usuarios</span>
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
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <span className="truncate">{displayName}</span>
              <ChevronDown className="size-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs text-slate-500">
              <div className="truncate font-medium text-slate-700">{displayName}</div>
              {displayEmail ? <div className="truncate">{displayEmail}</div> : null}
            </div>
            <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
