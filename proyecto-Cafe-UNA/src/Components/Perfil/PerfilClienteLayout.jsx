import { useEffect, useState } from "react";

import { ClienteSidebar } from "./ClienteSidebar";
import { SidebarProvider, SidebarTrigger, useSidebar } from "../Admin/ui/Sidebar";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { ST } from "../T/ST";
import { forceUnlockAdminScroll } from "../../hooks/useBodyScrollLock";

function ClienteMain({ children }) {
  const { openMobile } = useSidebar();
  const [esMobile, setEsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setEsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const bloquearMain = openMobile && esMobile;

  return (
    <main
      className={`min-h-svh min-w-0 flex-1 bg-[#fafafa] ${bloquearMain ? "pointer-events-none" : ""}`}
      inert={bloquearMain || undefined}
      aria-hidden={bloquearMain || undefined}
    >
      <div className="sticky top-0 z-[80] flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <SidebarTrigger />
        <p className="text-[length:var(--text-body)] font-semibold text-slate-800">
          <ST>Mi cuenta</ST>
        </p>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher compact className="lang-switch--on-light" />
        </div>
      </div>
      <div className="min-w-0 max-w-full overflow-x-clip">{children}</div>
    </main>
  );
}

export function PerfilClienteLayout({ children }) {
  useEffect(() => {
    forceUnlockAdminScroll();
  }, []);

  return (
    <SidebarProvider>
      <ClienteSidebar />
      <ClienteMain>{children}</ClienteMain>
    </SidebarProvider>
  );
}

export default PerfilClienteLayout;
