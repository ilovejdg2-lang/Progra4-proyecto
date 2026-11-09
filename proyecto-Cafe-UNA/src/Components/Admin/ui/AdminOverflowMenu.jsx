import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";

import { ST } from "../../T/ST";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]";

const itemBase = `flex min-h-[var(--control-height)] w-full items-center gap-2.5 rounded-md! px-3 text-left text-[length:var(--text-body)] font-medium no-underline transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:bg-[var(--admin-surface-hover)] ${focusRing} -outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent`;

const VIEWPORT_PAD = 8;
const TRIGGER_GAP = 4;

/**
 * Overflow ("...") menu for secondary and destructive actions.
 * items: [{ key, label, icon?, onSelect?, to?, params?, tone?: "danger", className?, disabled?, hint? }]
 * `hint` explains a disabled item: it renders as a second line inside the item at full contrast and
 * describes it. A disabled item with a hint uses aria-disabled so it stays focusable and reachable
 * by arrow keys; without a hint it is natively disabled.
 * The menu renders in a portal (the nearest open <dialog>, else document.body) with fixed
 * positioning so scrolling table shells never clip it. Items with `to` render as router links.
 * Escape, outside click, Tab and selecting an item close the menu; Escape and selection return
 * focus to the trigger.
 */
export function AdminOverflowMenu({ label, items, className = "", align = "right" }) {
  const [open, setOpen] = useState(false);
  const [menuHost, setMenuHost] = useState(null);
  const [menuStyle, setMenuStyle] = useState({ position: "fixed", top: 0, left: 0 });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Items hidden by responsive classes (display: none) cannot take focus, so navigation skips them.
  const visibleItems = () =>
    itemRefs.current.filter((node) => node && !node.disabled && getComputedStyle(node).display !== "none");

  useLayoutEffect(() => {
    if (!open) return undefined;
    const sync = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const size = menu.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = size.width;
      const height = Math.min(size.height, vh - VIEWPORT_PAD * 2);
      const rawLeft = align === "right" ? rect.right - width : rect.left;
      const left = Math.max(VIEWPORT_PAD, Math.min(rawLeft, vw - width - VIEWPORT_PAD));
      const below = rect.bottom + TRIGGER_GAP;
      const above = rect.top - TRIGGER_GAP - height;
      const fitsBelow = below + height <= vh - VIEWPORT_PAD;
      const rawTop = fitsBelow || above < VIEWPORT_PAD ? below : above;
      const top = Math.max(VIEWPORT_PAD, Math.min(rawTop, vh - height - VIEWPORT_PAD));
      setMenuStyle((previous) =>
        previous.top === `${top}px` && previous.left === `${left}px`
          ? previous
          : {
              position: "fixed",
              top: `${top}px`,
              left: `${left}px`,
              maxHeight: `${vh - VIEWPORT_PAD * 2}px`,
              overflowY: "auto",
            },
      );
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (open) visibleItems()[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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
    if (item.disabled) return;
    close();
    item.onSelect?.();
  };

  // Escape must work wherever focus is while open (trigger included); the menu handler stops its own events.
  // React bubbles portal events through the React tree, so this also sees keys pressed inside the menu.
  const onRootKeyDown = (event) => {
    if (open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  // A modal <dialog> sits in the top layer, so the menu must live inside it to stay visible.
  const openMenu = () => {
    setMenuHost(rootRef.current?.closest("dialog") ?? null);
    setOpen(true);
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
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
        className={`inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full! text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] aria-expanded:bg-[var(--admin-surface-hover)] aria-expanded:text-[var(--admin-text-primary)] ${focusRing}`}
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              onKeyDown={onMenuKeyDown}
              style={menuStyle}
              className="z-[100030] w-56 max-w-[calc(100vw-1rem)] rounded-[var(--admin-radius-popover)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 shadow-lg"
            >
              {items.map((item, index) => {
                const Icon = item.icon;
                const tone = item.tone === "danger" ? "text-[color:var(--admin-status-danger-text)]!" : "text-[color:var(--admin-text-primary)]";
                const ariaDisabled = Boolean(item.disabled && item.hint);
                const hintId = item.hint ? `${menuId}-${item.key}-hint` : undefined;
                const dim = ariaDisabled ? "opacity-60" : "";
                const cls = `${itemBase} ${ariaDisabled ? "items-start py-2" : ""} ${tone} ${item.className || ""}`;
                const content = (
                  <>
                    {Icon ? <Icon className={`size-4 shrink-0 ${ariaDisabled ? "mt-0.5" : ""} ${dim}`} aria-hidden="true" /> : null}
                    <span className="min-w-0 flex-1">
                      <span className={`block ${dim}`}><ST>{item.label}</ST></span>
                      {item.hint ? (
                        <span
                          id={hintId}
                          aria-hidden="true"
                          className="mt-0.5 block text-xs font-normal leading-snug text-[color:var(--admin-text-muted)]"
                        >
                          <ST>{item.hint}</ST>
                        </span>
                      ) : null}
                    </span>
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
                    disabled={item.disabled && !ariaDisabled}
                    aria-disabled={ariaDisabled ? "true" : undefined}
                    aria-describedby={hintId}
                    className={cls}
                    onClick={() => (ariaDisabled ? undefined : select(item))}
                  >
                    {content}
                  </button>
                );
              })}
            </div>,
            menuHost ?? document.body,
          )
        : null}
    </div>
  );
}
