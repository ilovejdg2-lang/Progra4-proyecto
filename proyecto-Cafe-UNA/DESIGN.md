---
name: Café UNA Admin Design System
description: Incumbent design system and component specifications for the Café UNA administrative backoffice
colors:
  primary: "#020617"
  primary-hover: "#404040"
  neutral-bg: "#fafafa"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-text: "#0f172a"
  neutral-text-muted: "#64748b"
  dark-bg: "#0e1116"
  dark-surface: "#161b22"
  dark-surface-elevated: "#12161c"
  dark-border: "#1e293b"
  dark-text: "#e2e8f0"
  dark-text-muted: "#94a3b8"
  brand-coffee: "#5c4038"
  brand-coffee-dark: "#2a1612"
  status-success-bg: "#dcfce7"
  status-success-text: "#15803d"
  status-danger-bg: "#fee2e2"
  status-danger-text: "#dc2626"
  status-warning-bg: "#fef3c7"
  status-warning-text: "#b45309"
typography:
  display:
    fontFamily: "'Geist Variable', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.65rem, 2.2vw, 2rem)"
    fontWeight: "700"
    lineHeight: "1.2"
  title:
    fontFamily: "'Geist Variable', system-ui, -apple-system, sans-serif"
    fontSize: "1.05rem"
    fontWeight: "600"
    lineHeight: "1.4"
  body:
    fontFamily: "'Geist Variable', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: "400"
    lineHeight: "1.6"
  label:
    fontFamily: "'Geist Variable', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: "600"
    lineHeight: "1.4"
rounded:
  full: "9999px"
  2xl: "1rem"
  xl: "0.75rem"
  lg: "0.5rem"
  md: "0.375rem"
spacing:
  control-height: "44px"
  control-pad-x: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height}"
    padding: "0 1.25rem"
  button-cancel:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text-muted}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height}"
    padding: "0 1.25rem"
---

# Design System: Café UNA Admin

## Overview

The Café UNA administrative panel is a mission-critical, data-dense web application for operational and university backoffice workflows. The interface is characterized by a hybrid aesthetic: heavy usage of pill-shaped interactive elements (`rounded-full`) contrasting with rectangular table layouts and large card dialogs. 

Key Characteristics:
- **Operate Surface Mode**: Prioritizes task execution, record scanning, and data entry over expressive marketing visuals.
- **Pill Form Factor**: Pervasive use of `rounded-full` (over 250 occurrences across 57 admin files) for buttons, search inputs, badges, and pagination controls.
- **Dual-Theme Scoping**: A light theme with Slate neutrals paired with a specialized dark theme defined in `src/styles/adminDark.css` and scoped under `body.admin-route-active`.
- **Known Tension & Inconsistencies**: The incumbent system features high density, with large pages (such as `Usuarios.jsx` at 1800+ lines) coupling multi-field filters, large TanStack tables, and deep modal workflows into single viewports. Controls frequently mix `--control-height: 44px` with arbitrary padding combinations (`py-2 px-5`, `h-10`, `h-9`).

## Colors

The admin palette relies primarily on Tailwind Slate neutrals, with subtle warm coffee accents (`#5c4038` and `#2a1612`) rooted in the institutional brand.

- **Light Mode Foundations**:
  - Main background: `#fafafa`
  - Container/Card surface: `#ffffff`
  - Primary text: `slate-900` (`#0f172a`)
  - Secondary/Muted text: `slate-600` (`#475569`) and `slate-500` (`#64748b`)
  - Structural borders: `slate-200` (`#e2e8f0`) and `slate-100` (`#f1f5f9`)
  - Primary interactive surface: `slate-950` (`#020617`) with hover `neutral-700` (`#404040`)
- **Dark Mode Foundations (`src/styles/adminDark.css`)**:
  - Main canvas background: `#0e1116`
  - Surface panels & modal root: `#161b22`
  - Table hover & input background: `#12161c`
  - Primary dark text: `#e2e8f0`
  - Secondary dark text: `#94a3b8`
  - Accent chips & pills: semi-transparent tints (`rgba(120, 53, 15, 0.35)` for amber/yellow, `rgba(12, 74, 110, 0.4)` for sky/blue, `rgba(6, 78, 59, 0.4)` for emerald/green).
- **Inconsistencies Observed**:
  - Direct Tailwind utility classes (`bg-white`, `bg-slate-50`, `text-slate-600`) are hardcoded in views. While `Usuarios.jsx` incorporates 12 `dark:` variant classes, dark mode relies heavily on 59 scoped `!important` overrides inside `adminDark.css` to force light classes into dark equivalents.
  - Semantic status indicators (e.g., active vs. inactive users) vary between plain text colors (`text-green-700` / `text-red-600`) and styled pill badges (`bg-amber-50 text-amber-900`).

## Typography

The typography is built on `@fontsource-variable/geist` (`Geist Variable`) across all headings and interface copy.

- **Tokens Declared in `src/index.css`**:
  - `--text-title`: `clamp(1.65rem, 2.2vw, 2rem)` (page-level title)
  - `--text-subtitle`: `1.05rem` (section titles and modal headers)
  - `--text-body`: `1rem` (table cells, inputs, body text)
- **Scale Inconsistencies**:
  - Despite the three intentional CSS custom property tokens, admin components heavily employ ad-hoc Tailwind text sizes: `text-xs`, `text-sm`, `text-[10px]`, `text-base`, and `text-lg`.
  - Table headers use `text-[length:var(--text-body)]` or `text-xs uppercase font-semibold`, causing font size discrepancies across listing pages.

## Layout

- **Shell Architecture**: `AdminLayout` wraps the admin experience with a sticky 56px header (`h-14`) containing a sidebar trigger, breadcrumbs, language switcher, help link, theme toggle, and notification bell.
- **Main Container**: Content area rendered in `<main>` with padding `p-4 pb-10 md:p-6 md:pb-12` and `overflow-x-clip`.
- **Responsive Handling**:
  - Desktop: Multi-column tables enclosed in `.admin-table-shell` (`hidden md:block`).
  - Mobile: Tables hide on `< 768px` in favor of stacked card lists (`divide-y divide-slate-100 md:hidden`).
- **Inconsistencies Observed**:
  - The filter toolbar (`AdminListaToolbar`) wraps filters inside a grid that can collapse into uneven columns or stretch unpredictably across desktop viewports (`xl:flex-row xl:items-end xl:justify-center`).

## Elevation & Depth

- **General Depth**: Flat aesthetic with 1px border dividers (`border-slate-200` in light, `border-slate-800` in dark).
- **Modals**: High elevation via `shadow-2xl` on `<ModalDialog>` and `.admin-modal-root`.
- **Dropdowns & Popovers**: Subtle elevation using Radix DropdownMenu shadow defaults (`shadow-md`).
- **Inconsistencies Observed**:
  - In light mode, surfaces rely on alternating background shades (`#fafafa` vs. `#ffffff` vs. `bg-slate-50`) rather than a structured elevation token system. In dark mode, `#161b22` is applied globally via CSS overrides without distinct elevation layer tokens.

## Shapes

- **Pill Shape Dominance**:
  - Buttons (`adminBtnPrimary`, `adminBtnCancel`, table action buttons) use `rounded-full`.
  - Filter and search inputs in `AdminListaToolbar` use `rounded-full`.
  - Pagination controls in `AdminPaginacion` use `rounded-full`.
- **Card & Dialog Radii**:
  - Modals use `rounded-t-2xl sm:rounded-2xl`.
  - Mobile list articles use flat division without border radius.
  - Dropdown popovers and selects use `rounded-md` or `rounded-lg`.
- **Inconsistencies Observed**:
  - Marked contrast between pill controls (`rounded-full`) and sharp/moderately rounded containers (`rounded-md` to `rounded-2xl`).

## Components

### 1. Buttons (`AdminModal.jsx`, Page Toolbars)
- **Primary**: `rounded-full border border-slate-950 bg-slate-950 px-5 text-white font-bold min-h-[44px] hover:bg-neutral-700`
- **Secondary / Cancel**: `rounded-full border border-slate-300 bg-white px-5 text-slate-600 font-semibold min-h-[44px] hover:bg-slate-50`
- **Variants**: Specialized variants exist (e.g., `adminBtnVoluntariadoPrimary`, `adminBtnVoluntariadoCancel`) with slight padding and color divergence.

### 2. Modals (`AdminModal.jsx`, `src/Components/ui/ModalDialog.jsx`)
- Built on top of native HTML `<dialog>` element.
- Scrim: `rgb(15 23 42 / 0.55)` backdrop.
- Fixed structure: `AdminModalHeader` (title + close button), scrollable `AdminModalBody`, and `AdminModalFooter` / `AdminModalActions`.

### 3. Toolbar & Filters (`AdminListaToolbar.jsx`)
- Search field: Input with search icon, `rounded-full`, height `44px`.
- Filters: Rendered using `UiSelect` or native date inputs, stacked in a responsive container.
- Results Summary: Displays "Mostrando X de Y registros" with a "Limpiar filtros" action button.

### 4. Data Tables (`Usuarios.jsx` and similar pages)
- TanStack Table powered.
- Headers: Sortable buttons with direction indicators (`▲`, `▼`, `↕`).
- Rows: Divided by `divide-slate-50` with hover state `hover:bg-slate-50/60`.

### 5. Pagination (`AdminPaginacion.jsx`)
- "Anterior" and "Siguiente" pill buttons flanking an `aria-current="page"` indicator (`X / Y`).
- Automatically hidden when `total <= pageSize` or `totalPages <= 1`.

## Do's and Don'ts

### Do's
- **DO** scope all admin custom properties and style overrides strictly under `body.admin-route-active`.
- **DO** preserve the `rounded-full` pill shape on action controls, search bars, and tags unless an explicit change is requested and approved.
- **DO** maintain strict keyboard accessibility: focus rings, Escape key handling, and `<dialog>` modal primitives.
- **DO** route all user-facing strings through `<ST>` or `useTraducir` with Spanish default strings.
- **DO** ensure high contrast for status chips and data indicators in both light and dark themes.

### Don'ts
- **DON'T** modify global `:root` definitions in `src/index.css` that impact public storefront visuals.
- **DON'T** introduce heavy, decorative animations that slow down operational navigation or data scanning.
- **DON'T** rely on raw `!important` rules in view components; migrate progressively to semantic tokens or Tailwind `dark:` variants.
- **DON'T** hardcode English text or bypass translation helpers in user-facing components.
- **DON'T** change public site components or backend code during admin redesign tasks.
