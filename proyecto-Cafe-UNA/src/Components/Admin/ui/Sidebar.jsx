"use client";

import * as React from "react";
import { PanelLeft, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { usePersistedBoolean } from "../../../hooks/usePersistedBoolean";

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
  const [open, setOpen] = usePersistedBoolean(SIDEBAR_OPEN_KEY, defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  useBodyScrollLock(openMobile);

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
        className={cn("flex min-h-svh w-full bg-[var(--admin-bg)] text-[var(--admin-text-primary)]", className)}
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
  const position = side === "right" ? "right-0" : "left-0";
  const isIcon = collapsible === "icon";
  const isOffcanvas = collapsible === "offcanvas";

  return (
    <>
      <aside
        data-state={state}
        data-collapsible={collapsible}
        style={{ borderRadius: 0, ...props.style }}
        className={cn(
          "admin-sidebar group/sidebar fixed inset-y-0 z-30 hidden flex-col bg-[var(--admin-surface)] text-[var(--admin-text-primary)] transition-[width,transform] duration-200 md:flex !rounded-none",
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
          aria-label="Cerrar menú"
          tabIndex={openMobile ? 0 : -1}
          onClick={() => setOpenMobile(false)}
          onPointerDown={(event) => event.stopPropagation()}
        />
        <aside
          style={{ borderRadius: 0 }}
          className={cn(
            "absolute inset-y-0 z-10 flex w-72 max-w-[85vw] flex-col bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-xl transition-transform duration-300 ease-out !rounded-none",
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
            className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-[var(--admin-control-radius)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)]"
            onClick={() => setOpenMobile(false)}
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar menú</span>
          </button>
          {children}
        </aside>
      </div>
    </>
  );
}

export { useSidebar };

export function SidebarTrigger({ className, onClick, ...props }) {
  const { toggleSidebar, open, openMobile } = useSidebar();
  const [esMobile, setEsMobile] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setEsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const abierto = esMobile ? openMobile : open;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[var(--admin-control-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] shadow-sm transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)]",
        className,
      )}
      aria-expanded={abierto}
      aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
      title={abierto ? "Cerrar menú" : "Abrir menú"}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Abrir o cerrar el menú</span>
    </button>
  );
}

export function SidebarHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-4 transition-[padding] group-data-[state=collapsed]/sidebar:flex group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2",
        className,
      )}
      {...props}
    />
  );
}

const sidebarScrollTops = new Map();

function sidebarVisible(element) {
  return element.getClientRects().length > 0;
}

export function SidebarContent({ className, scrollKey, onScroll, ...props }) {
  const ref = React.useRef(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!scrollKey || !element || !sidebarVisible(element)) return;
    element.scrollTop = sidebarScrollTops.get(scrollKey) || 0;
  }, [scrollKey]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2",
        className,
      )}
      onScroll={(event) => {
        const element = event.currentTarget;
        if (scrollKey && sidebarVisible(element)) {
          sidebarScrollTops.set(scrollKey, element.scrollTop);
        }
        onScroll?.(event);
      }}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-2 group-data-[state=collapsed]/sidebar:px-1",
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
        "flex h-9 w-full items-center gap-2 rounded-[var(--admin-control-radius)] px-2 text-sm font-medium text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0 [&_span]:min-w-0 [&_span]:truncate",
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
        "flex h-9 w-full items-center gap-2 rounded-[var(--admin-control-radius)] px-2 text-left text-sm text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] focus-visible:outline-none data-[status=active]:bg-[var(--admin-surface-hover)] data-[status=active]:text-[var(--admin-accent-coffee)] data-[status=active]:font-semibold [&_svg]:size-4 [&_svg]:shrink-0",
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
        "ml-4 flex flex-col gap-1 border-l border-[var(--admin-border)] py-1 pl-3 group-data-[state=collapsed]/sidebar:hidden",
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
        "flex h-8 w-full items-center gap-2 rounded-[var(--admin-control-radius)] px-2 text-left text-sm text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] focus-visible:outline-none data-[status=active]:bg-[var(--admin-surface-hover)] data-[status=active]:text-[var(--admin-accent-coffee)] data-[status=active]:font-semibold [&_svg]:size-4 [&_svg]:shrink-0 [&_span]:min-w-0 [&_span]:truncate",
        className,
      )}
      {...props}
    />
  );
}
