import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";

import { ST } from "../../T/ST";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]";

const itemBase = `flex min-h-[var(--control-height)] w-full items-center gap-2.5 rounded-md! px-3 text-left text-[length:var(--text-body)] font-medium no-underline transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:bg-[var(--admin-surface-hover)] ${focusRing} -outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent`;

/**
 * Overflow ("...") menu for secondary and destructive actions.
 * items: [{ key, label, icon?, onSelect?, to?, params?, tone?: "danger", className?, disabled? }]
 * Items with `to` render as router links. Escape, outside click, Tab and selecting an
 * item close the menu; Escape and selection return focus to the trigger.
 */
export function AdminOverflowMenu({ label, items, className = "", align = "right" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Items hidden by responsive classes (display: none) cannot take focus, so navigation skips them.
  const visibleItems = () =>
    itemRefs.current.filter((node) => node && !node.disabled && getComputedStyle(node).display !== "none");

  useEffect(() => {
    if (open) visibleItems()[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const focusAt = (index) => {
    const nodes = visibleItems();
    if (nodes.length === 0) return;
    nodes[(index + nodes.length) % nodes.length]?.focus();
  };

  const onMenuKeyDown = (event) => {
    const nodes = visibleItems();
    const current = nodes.indexOf(document.activeElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(nodes.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
    }
  };

  const select = (item) => {
    close();
    item.onSelect?.();
  };

  // Escape must work wherever focus is while open (trigger included); the menu handler stops its own events.
  const onRootKeyDown = (event) => {
    if (open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onRootKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full! text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] aria-expanded:bg-[var(--admin-surface-hover)] aria-expanded:text-[var(--admin-text-primary)] ${focusRing}`}
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`absolute top-full z-40 mt-1 w-56 max-w-[calc(100vw-2rem)] rounded-[var(--admin-radius-popover)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const tone = item.tone === "danger" ? "text-[color:var(--admin-status-danger-text)]!" : "text-[color:var(--admin-text-primary)]";
            const cls = `${itemBase} ${tone} ${item.className || ""}`;
            const content = (
              <>
                {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                <span className="min-w-0 flex-1"><ST>{item.label}</ST></span>
              </>
            );
            const ref = (node) => {
              itemRefs.current[index] = node;
            };
            return item.to ? (
              <Link
                key={item.key}
                ref={ref}
                to={item.to}
                params={item.params}
                role="menuitem"
                tabIndex={-1}
                className={cls}
                onClick={() => close()}
              >
                {content}
              </Link>
            ) : (
              <button
                key={item.key}
                ref={ref}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                className={cls}
                onClick={() => select(item)}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
