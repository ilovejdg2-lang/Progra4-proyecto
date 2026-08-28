import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import AdminRouteLoading from "../../../Components/Admin/AdminRouteLoading";
import { AdminStockNotificationsBell } from "../../../Components/Admin/AdminStockNotificationsBell";
import { AppSidebar } from "../../../Components/Admin/AppSidebar";
import { SidebarProvider, SidebarTrigger, useSidebar } from "../../../Components/Admin/ui/Sidebar";
import { forceUnlockAdminScroll } from "../../../hooks/useBodyScrollLock";
import { getActiveSessionUser } from "../../../services/sessionService";

function AdminMain({ children }) {
  const { openMobile } = useSidebar();

  return (
    <main
      className={`min-h-svh min-w-0 flex-1 overflow-x-clip bg-[#fafafa] ${openMobile ? "max-md:pointer-events-none" : ""}`}
      inert={openMobile || undefined}
      aria-hidden={openMobile || undefined}
    >
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <SidebarTrigger />
        <AdminStockNotificationsBell />
      </div>
      <div className="min-w-0 max-w-full p-4 pb-10 md:p-6 md:pb-12">{children}</div>
    </main>
  );
}

export function AdminLayout({ children }) {
  const navigate = useNavigate();
  const user = getActiveSessionUser();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [navigate, user]);

  useEffect(() => {
    forceUnlockAdminScroll();
  }, []);

  if (!user || user.role !== "admin") {
    return <AdminRouteLoading message="Verificando acceso..." />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <AdminMain>{children}</AdminMain>
    </SidebarProvider>
  );
}
