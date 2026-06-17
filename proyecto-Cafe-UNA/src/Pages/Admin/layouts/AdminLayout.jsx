import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import AdminRouteLoading from "../../../Components/Admin/AdminRouteLoading";
import { AppSidebar } from "../../../Components/Admin/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "../../../Components/Admin/ui/Sidebar";
import { getActiveSessionUser } from "../../../services/sessionService";

export function AdminLayout({ children }) {
  const navigate = useNavigate();
  const user = getActiveSessionUser();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [navigate, user]);

  if (!user || user.role !== "admin") {
    return <AdminRouteLoading message="Verificando acceso..." />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="min-h-svh min-w-0 flex-1 overflow-x-hidden bg-white">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <SidebarTrigger />
        </div>
        <div className="min-w-0 p-4 md:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
