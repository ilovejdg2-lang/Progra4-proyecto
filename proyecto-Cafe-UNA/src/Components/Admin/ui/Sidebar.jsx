"use client";

import * as React from "react";
import { PanelLeft, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

const SidebarContext = React.createContext(null);

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

export function SidebarProvider({ defaultOpen = true, className, children, ...props }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  useBodyScrollLock(openMobile);

  const toggleSidebar = React.useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setOpenMobile((value) => !value);
      return;
    }

    setOpen((value) => !value);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  React.useEffect(() => {
    if (!openMobile) {
      return;
    }

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setOpenMobile(false);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [openMobile]);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      state: open ? "expanded" : "collapsed",
      toggleSidebar,
    }),
    [open, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn("flex min-h-svh w-full bg-white text-slate-950", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  side = "left",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { open, openMobile, setOpenMobile } = useSidebar();
  const position = side === "right" ? "right-0 border-l" : "left-0 border-r";

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 z-30 hidden w-64 flex-col border-slate-200 bg-white text-slate-900 shadow-sm transition-transform duration-200 md:flex",
          position,
          collapsible === "offcanvas" && !open && side === "left" && "-translate-x-full",
          collapsible === "offcanvas" && !open && side === "right" && "translate-x-full",
          className,
        )}
        {...props}
      >
        {children}
      </aside>

      {open && collapsible !== "none" ? <div className="hidden w-64 shrink-0 md:block" /> : null}

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          openMobile ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!openMobile}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 border-0 bg-slate-950/40 transition-opacity duration-300 ease-out",
            openMobile ? "opacity-100" : "opacity-0",
          )}
          aria-label="Cerrar sidebar"
          tabIndex={openMobile ? 0 : -1}
          onClick={() => setOpenMobile(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 flex w-72 max-w-[85vw] flex-col border-slate-200 bg-white text-slate-900 shadow-xl transition-transform duration-300 ease-out",
            position,
            openMobile
              ? "translate-x-0"
              : side === "left"
                ? "-translate-x-full"
                : "translate-x-full",
            className,
          )}
        >
          <button
            type="button"
            className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setOpenMobile(false)}
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar sidebar</span>
          </button>
          {children}
        </aside>
      </div>
    </>
  );
}

export { useSidebar };

export function SidebarTrigger({ className, onClick, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-950",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Abrir/cerrar sidebar</span>
    </button>
  );
}

export function SidebarHeader({ className, ...props }) {
  return <div className={cn("border-b border-slate-200 p-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div className={cn("border-t border-slate-200 p-2", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1 py-1", className)} {...props} />;
}

export function SidebarGroupLabel({ asChild = false, className, ...props }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }) {
  return <div className={cn("w-full", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }) {
  return <ul className={cn("flex w-full flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }) {
  return <li className={cn("relative", className)} {...props} />;
}

export function SidebarMenuButton({ asChild = false, className, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSub({ className, ...props }) {
  return (
    <ul
      className={cn("ml-4 flex flex-col gap-1 border-l border-slate-200 py-1 pl-3", className)}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }) {
  return <li className={cn("relative", className)} {...props} />;
}

export function SidebarMenuSubButton({ asChild = false, className, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}
