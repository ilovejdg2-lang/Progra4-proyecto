"use client";

import * as React from "react";
import { PanelLeft, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

const SidebarContext = React.createContext(null);
const SIDEBAR_OPEN_KEY = "admin-sidebar-desktop-open";

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
  const [open, setOpenState] = React.useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
    return saved === null ? defaultOpen : saved === "true";
  });
  const [openMobile, setOpenMobile] = React.useState(false);

  useBodyScrollLock(openMobile);

  const setOpen = React.useCallback((value) => {
    setOpenState((actual) => {
      const next = typeof value === "function" ? value(actual) : value;
      localStorage.setItem(SIDEBAR_OPEN_KEY, String(next));
      return next;
    });
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setOpenMobile((value) => !value);
      return;
    }

    setOpen((value) => !value);
  }, [setOpen]);

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
    [open, openMobile, setOpen, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn("flex min-h-svh w-full bg-white text-slate-950", className)}
        data-sidebar-state={open ? "expanded" : "collapsed"}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  side = "left",
  collapsible = "icon",
  className,
  children,
  ...props
}) {
  const { open, openMobile, setOpenMobile, state } = useSidebar();
  const position = side === "right" ? "right-0 border-l" : "left-0 border-r";
  const isIcon = collapsible === "icon";
  const isOffcanvas = collapsible === "offcanvas";

  return (
    <>
      <aside
        data-state={state}
        data-collapsible={collapsible}
        className={cn(
          "admin-sidebar group/sidebar fixed inset-y-0 z-30 hidden flex-col border-slate-200 bg-white text-slate-900 shadow-sm transition-[width,transform] duration-200 md:flex",
          position,
          isIcon && (open ? "w-64" : "w-16"),
          isOffcanvas && "w-64",
          isOffcanvas && !open && side === "left" && "-translate-x-full",
          isOffcanvas && !open && side === "right" && "translate-x-full",
          collapsible === "none" && "w-64",
          className,
        )}
        {...props}
      >
        {children}
      </aside>

      {collapsible !== "none" ? (
        <div
          className={cn(
            "hidden shrink-0 transition-[width] duration-200 md:block",
            isIcon ? (open ? "w-64" : "w-16") : open ? "w-64" : "w-0",
          )}
          aria-hidden="true"
        />
      ) : (
        <div className="hidden w-64 shrink-0 md:block" aria-hidden="true" />
      )}

      <div
        className={cn(
          "fixed inset-0 z-[100] md:hidden",
          openMobile ? "pointer-events-auto" : "pointer-events-none",
        )}
        inert={!openMobile || undefined}
        aria-hidden={!openMobile}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 z-0 touch-none border-0 bg-slate-950/55 transition-opacity duration-300 ease-out",
            openMobile ? "opacity-100" : "opacity-0",
          )}
          aria-label="Cerrar sidebar"
          tabIndex={openMobile ? 0 : -1}
          onClick={() => setOpenMobile(false)}
          onPointerDown={(event) => event.stopPropagation()}
        />
        <aside
          className={cn(
            "absolute inset-y-0 z-10 flex w-72 max-w-[85vw] flex-col border-slate-200 bg-white text-slate-900 shadow-xl transition-transform duration-300 ease-out",
            position,
            openMobile
              ? "translate-x-0"
              : side === "left"
                ? "-translate-x-full"
                : "translate-x-full",
            className,
          )}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
  const { toggleSidebar, open } = useSidebar();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-950",
        className,
      )}
      aria-expanded={open}
      aria-label={open ? "Cerrar sidebar" : "Abrir sidebar"}
      title={open ? "Cerrar sidebar" : "Abrir sidebar"}
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
  return (
    <div
      className={cn(
        "border-b border-slate-200 p-4 transition-[padding] group-data-[state=collapsed]/sidebar:flex group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "border-t border-slate-200 p-2 group-data-[state=collapsed]/sidebar:px-1",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1 py-1", className)} {...props} />;
}

export function SidebarGroupLabel({ asChild = false, className, onClick, ...props }) {
  const Comp = asChild ? Slot : "div";
  const { state, setOpen } = useSidebar();

  return (
    <Comp
      className={cn(
        "flex h-9 w-full items-center gap-2 px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-transparent hover:text-slate-950 [&_svg]:size-4 [&_svg]:shrink-0 [&_span]:min-w-0 [&_span]:truncate",
        "group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0 group-data-[state=collapsed]/sidebar:[&>span]:hidden group-data-[state=collapsed]/sidebar:[&>svg.ml-auto]:hidden",
        className,
      )}
      onClick={(event) => {
        if (state === "collapsed") {
          setOpen(true);
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }) {
  return (
    <div
      className={cn("w-full group-data-[state=collapsed]/sidebar:hidden", className)}
      {...props}
    />
  );
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
        "flex h-9 w-full items-center gap-2 px-2 text-left text-sm text-slate-700 transition-colors hover:bg-transparent hover:text-slate-950 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0",
        "group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0 group-data-[state=collapsed]/sidebar:[&>span]:hidden group-data-[state=collapsed]/sidebar:[&_span]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSub({ className, ...props }) {
  return (
    <ul
      className={cn(
        "ml-4 flex flex-col gap-1 border-l border-slate-200 py-1 pl-3 group-data-[state=collapsed]/sidebar:hidden",
        className,
      )}
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
        "flex h-8 w-full items-center gap-2 px-2 text-left text-sm text-slate-600 transition-colors hover:bg-transparent hover:text-slate-950 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0 [&_span]:min-w-0 [&_span]:truncate",
        className,
      )}
      {...props}
    />
  );
}
