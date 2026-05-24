import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { AppSidebar } from "../../../Components/Admin/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "../../../Components/Admin/ui/Sidebar";

export function AdminLayout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [navigate, user]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="min-h-svh flex-1 bg-slate-50">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <SidebarTrigger />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
