import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { StatusDot } from "../../../../Components/Admin/ui/StatusDot";
import { LOCATION_PILLS_MAX, locationTabId, safeIdPart } from "./locationSelectorConfig";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]";

const isActive = (location) => location.activo !== false;

function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function useStatusWord(location) {
  const activo = useTraducir("activo");
  const inactivo = useTraducir("inactivo");
  return isActive(location) ? activo : inactivo;
}

function LocationTab({ location, selected, onSelect, onKeyDown, registerRef, tabId, panelId }) {
  const estado = useStatusWord(location);
  const name = useTraducir(location.name);
  const activo = isActive(location);
  return (
    <button
      ref={registerRef}
      type="button"
      role="tab"
      id={tabId}
      aria-label={`${name}, ${estado}`}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`inline-flex min-h-[var(--control-height)] shrink-0 snap-start items-center gap-2 rounded-full! border px-4 text-[length:var(--text-body)] transition-colors ${focusRing} ${
        selected
          ? "border-[var(--admin-border)] bg-[var(--admin-segment-active)] font-semibold text-[color:var(--admin-text-primary)] shadow-sm"
          : `border-transparent font-medium hover:text-[color:var(--admin-text-primary)] ${
              activo ? "text-[color:var(--admin-text-muted)]" : "text-[color:var(--admin-text-muted)] opacity-80"
            }`
      }`}
    >
      <span className="whitespace-nowrap"><ST>{location.name}</ST></span>
      <StatusDot tone={activo ? "success" : "neutral"} />
    </button>
  );
}

function LocationPills({ locations, selectedCode, onSelect, panelId, baseId }) {
  const tabRefs = useRef({});
  const tLabel = useTraducir("Puntos de venta");

  useEffect(() => {
    tabRefs.current[selectedCode]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selectedCode]);

  const handleKeyDown = (event, index) => {
    const last = locations.length - 1;
    let next = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    const target = locations[next];
    onSelect(target.code);
    tabRefs.current[target.code]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={tLabel}
      className="pv-pills flex w-fit max-w-full snap-x snap-mandatory gap-1 overflow-x-auto rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-hover)] p-1"
    >
      {locations.map((location, index) => (
        <LocationTab
          key={location.code}
          location={location}
          selected={location.code === selectedCode}
          onSelect={() => onSelect(location.code)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          registerRef={(node) => {
            tabRefs.current[location.code] = node;
          }}
          tabId={locationTabId(baseId, location.code)}
          panelId={panelId}
        />
      ))}
    </div>
  );
}

function ComboOption({ id, location, selected, highlighted, onChoose, onHover }) {
  const estado = useStatusWord(location);
  const name = useTraducir(location.name);
  const activo = isActive(location);
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      aria-label={`${name}, ${estado}`}
      // Keep focus in the search field: choosing must not blur it before the click lands.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onChoose}
      onMouseMove={onHover}
      className={`flex min-h-[var(--control-height)] cursor-pointer items-center gap-3 rounded-md px-3 text-[length:var(--text-body)] ${
        highlighted ? "bg-[var(--admin-surface-hover)]" : ""
      } ${activo ? "text-[color:var(--admin-text-primary)]" : "text-[color:var(--admin-text-muted)]"}`}
    >
      <StatusDot tone={activo ? "success" : "neutral"} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate ${selected ? "font-semibold" : "font-medium"}`}><ST>{location.name}</ST></span>
        <span className="block truncate text-xs text-[color:var(--admin-text-muted)]">{location.code}</span>
      </span>
      {selected ? <Check className="size-4 shrink-0 text-[color:var(--admin-text-primary)]" aria-hidden="true" /> : null}
    </li>
  );
}

function LocationCombobox({ locations, selectedCode, onSelect, baseId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listId = `${baseId}-listbox`;
  const tPrefix = useTraducir("Punto de venta");
  const tBuscar = useTraducir("Buscar punto de venta");
  const tPlaceholder = useTraducir("Buscar punto de venta...");
  const tNoResults = useTraducir("Sin resultados");
  const selected = locations.find((location) => location.code === selectedCode) || locations[0];
  const selectedStatus = useStatusWord(selected);
  const selectedName = useTraducir(selected.name);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return locations;
    return locations.filter((location) => normalize(`${location.name} ${location.code}`).includes(needle));
  }, [locations, query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  const openList = () => {
    setQuery("");
    const index = locations.findIndex((location) => location.code === selectedCode);
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const choose = (location) => {
    if (!location) return;
    onSelect(location.code);
    close();
  };

  const onInputKeyDown = (event) => {
    const count = filtered.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (count) setActiveIndex((index) => (index + 1) % count);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (count) setActiveIndex((index) => (index - 1 + count) % count);
        break;
      case "Home":
        if (count) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (count) {
          event.preventDefault();
          setActiveIndex(count - 1);
        }
        break;
      case "Enter":
        event.preventDefault();
        choose(filtered[activeIndex]);
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

  const activeOptionId = filtered[activeIndex] ? `${baseId}-opt-${safeIdPart(filtered[activeIndex].code)}` : undefined;

  return (
    <div ref={rootRef} className="relative w-full sm:w-96">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${tPrefix}: ${selectedName}, ${selectedStatus}`}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openList();
          }
        }}
        className={`flex min-h-[var(--control-height)] w-full items-center gap-3 rounded-full! border border-[var(--admin-border-input)] bg-[var(--admin-surface)] px-4 text-left text-[length:var(--text-body)] text-[color:var(--admin-text-primary)] transition-colors hover:bg-[var(--admin-surface-hover)] ${focusRing}`}
      >
        <span className="shrink-0 text-[color:var(--admin-text-muted)]"><ST>Punto de venta</ST></span>
        <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
          <span className="truncate"><ST>{selected.name}</ST></span>
          <StatusDot tone={isActive(selected) ? "success" : "neutral"} />
        </span>
        <ChevronDown className="size-4 shrink-0 text-[color:var(--admin-text-muted)]" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-64 rounded-[var(--admin-radius-popover)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 shadow-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--admin-text-muted)]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeOptionId}
              aria-label={tBuscar}
              placeholder={tPlaceholder}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] py-2 pl-9 pr-3 text-[length:var(--text-body)] text-[color:var(--admin-text-primary)] outline-none placeholder:text-[color:var(--admin-text-muted)] focus-visible:border-[var(--admin-focus-ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label={tPrefix} className="mt-2 max-h-72 overflow-y-auto">
            {filtered.map((location, index) => (
              <ComboOption
                key={location.code}
                id={`${baseId}-opt-${safeIdPart(location.code)}`}
                location={location}
                selected={location.code === selectedCode}
                highlighted={index === activeIndex}
                onChoose={() => choose(location)}
                onHover={() => setActiveIndex(index)}
              />
            ))}
          </ul>
          <p
            role="status"
            aria-live="polite"
            className={filtered.length === 0 ? "px-3 py-4 text-center text-[length:var(--text-body)] text-[color:var(--admin-text-muted)]" : "sr-only"}
          >
            {filtered.length === 0 ? tNoResults : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Location selector for the points-of-sale panel.
 * Pills (ARIA tabs) up to LOCATION_PILLS_MAX locations, searchable combobox above it.
 * `panelId` is the id of the region the tabs control (the page marks it as the tabpanel).
 */
export function PointOfSaleLocationSelector({ locations, selectedCode, onSelect, panelId, tabsBaseId }) {
  const generatedId = useId();
  const baseId = tabsBaseId || generatedId;
  if (locations.length === 0) return null;
  return (
    <div className="min-w-0 px-4 py-3 sm:px-6">
      {locations.length <= LOCATION_PILLS_MAX ? (
        <LocationPills locations={locations} selectedCode={selectedCode} onSelect={onSelect} panelId={panelId} baseId={baseId} />
      ) : (
        <LocationCombobox locations={locations} selectedCode={selectedCode} onSelect={onSelect} baseId={baseId} />
      )}
    </div>
  );
}
