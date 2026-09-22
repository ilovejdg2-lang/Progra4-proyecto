"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, ChevronDown, LogOut, ShoppingBag, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../Admin/ui/DropdownMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../Admin/ui/Sidebar";
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
import { readBrandLogos, cacheBrandLogos } from "../../lib/brandLogoCache";
import { ST } from "../T/ST";
import { textoUi } from "../../lib/textoVisible";

const linkActivo = {
  className: "text-slate-950",
};

export function ClienteSidebar() {
  const [user, setUser] = useState(() => getActiveSessionUser());
  const { setOpenMobile } = useSidebar();
  const displayName = textoUi(user?.name || user?.username || "Usuario");
  const displayEmail = user?.email || user?.correo || "";
  const roles = rolesDeUsuario(user);

  const puedePerfil = tienePermiso(roles, "ver_perfil_propio");
  const puedeMisCompras = tienePermiso(roles, "ver_historial_compras_propio");
  const puedeMisSolicitudes =
    tienePermiso(roles, "ver_solicitudes_propias") ||
    tienePermiso(roles, "hacer_solicitud_donacion") ||
    tienePermiso(roles, "ingresar_solicitud_voluntariado") ||
    tienePermiso(roles, "crear_solicitud_visitante");

  const avatarUrl = user?.fotoPerfilUrl?.trim()
    ? normalizeImageUrl(user.fotoPerfilUrl.trim(), { width: 96 })
    : "";
  const [avatarRoto, setAvatarRoto] = useState(false);
  const inicialAvatar = inicialDeNombre(displayName);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const onBrandClick = useHomeBrandNavigation();

  const [logoUrl, setLogoUrl] = useState(() => readBrandLogos().logoUrl);

  useEffect(() => {
    setAvatarRoto(false);
  }, [avatarUrl]);

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
        const nextLogoUrl = typeof navbar?.logoUrl === "string" ? navbar.logoUrl.trim() : "";
        setLogoUrl(nextLogoUrl);
        cacheBrandLogos({ logoUrl: nextLogoUrl });
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  const closeMobileSidebar = () => setOpenMobile(false);

  const handleLogout = () => {
    beginLogout();
    cancelPendingSessionRefresh();
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {puedePerfil ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/perfil"
                      activeOptions={{ exact: true }}
                      activeProps={linkActivo}
                      onClick={closeMobileSidebar}
                    >
                      <UserRound />
                      <span>
                        <ST>Mi perfil</ST>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              {puedeMisCompras ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/perfil/compras" activeProps={linkActivo} onClick={closeMobileSidebar}>
                      <ShoppingBag />
                      <span>
                        <ST>Mis compras</ST>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              {puedeMisSolicitudes ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/perfil/solicitudes"
                      activeProps={linkActivo}
                      onClick={closeMobileSidebar}
                    >
                      <ClipboardList />
                      <span>
                        <ST>Mis solicitudes</ST>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
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
                {displayEmail ? (
                  <span className="block truncate text-xs font-normal text-slate-500">
                    {displayEmail}
                  </span>
                ) : null}
              </span>
              <ChevronDown className="size-4 shrink-0 group-data-[state=collapsed]/sidebar:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="z-[100] w-56">
            {puedePerfil ? (
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="cursor-pointer" activeProps={linkActivo}>
                  <UserRound className="size-4" />
                  <span>
                    <ST>Mi perfil</ST>
                  </span>
                </Link>
              </DropdownMenuItem>
            ) : null}
            {puedeMisCompras ? (
              <DropdownMenuItem asChild>
                <Link to="/perfil/compras" className="cursor-pointer" activeProps={linkActivo}>
                  <ShoppingBag className="size-4" />
                  <span>
                    <ST>Mis compras</ST>
                  </span>
                </Link>
              </DropdownMenuItem>
            ) : null}
            {puedeMisSolicitudes ? (
              <DropdownMenuItem asChild>
                <Link to="/perfil/solicitudes" className="cursor-pointer" activeProps={linkActivo}>
                  <ClipboardList className="size-4" />
                  <span>
                    <ST>Mis solicitudes</ST>
                  </span>
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
              <span>
                <ST>Cerrar sesión</ST>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
