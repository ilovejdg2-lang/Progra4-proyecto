---
name: Café UNA Admin Design System
description: Design standard for all Café UNA admin screens, derived from the approved reference screen (InformacionPaginaPrincipal, PO approved 2026-11-07)
colors:
  bg: "#fafafa"
  surface: "#ffffff"
  surface-subtle: "#f8fafc"
  surface-hover: "#f1f5f9"
  segment-active: "#ffffff"
  text-primary: "#0f172a"
  text-muted: "#475569"
  text-decorative: "#94a3b8"
  coffee: "#5c4038"
  coffee-hover: "#452e27"
  coffee-soft: "#f6efec"
  on-coffee: "#ffffff"
  border: "#e2e8f0"
  border-subtle: "#f1f5f9"
  border-input: "#64748b"
  focus-ring: "#64748b"
  success-bg: "#dcfce7"
  success-text: "#15803d"
  danger-bg: "#fee2e2"
  danger-text: "#b91c1c"
  warning-bg: "#fef3c7"
  warning-text: "#b45309"
  dark-bg: "#0e1116"
  dark-surface: "#161b22"
  dark-surface-subtle: "#12161c"
  dark-surface-hover: "#21262d"
  dark-segment-active: "#343b45"
  dark-text-primary: "#e2e8f0"
  dark-text-muted: "#94a3b8"
  dark-text-decorative: "#64748b"
  dark-coffee: "#b88376"
  dark-coffee-hover: "#c48f82"
  dark-coffee-soft: "#2a1d19"
  dark-on-coffee: "#1a0f0c"
  dark-border: "#1e293b"
  dark-border-subtle: "#161f2e"
  dark-border-input: "#64748b"
  dark-focus-ring: "#94a3b8"
  dark-success-text: "#6ee7b7"
  dark-danger-text: "#fda4af"
  dark-warning-text: "#fcd34d"
typography:
  page-title:
    fontFamily: "'Geist Variable', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.65rem, 2.2vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.3
  modal-title:
    fontFamily: "'Geist Variable', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "'Geist Variable', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.011em"
  field-label:
    fontFamily: "'Geist Variable', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
  table-cell:
    fontFamily: "'Geist Variable', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
  caption:
    fontFamily: "'Geist Variable', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  pill: "9999px"
  card: "1rem"
  dialog: "1rem"
  popover: "0.5rem"
  chip: "0.5rem"
  thumb: "0.375rem"
spacing:
  control-height: "44px"
  row-pad-x: "1rem"
  row-pad-x-sm: "1.5rem"
  field-gap: "1rem"
components:
  button-coffee:
    backgroundColor: "{colors.coffee}"
    textColor: "{colors.on-coffee}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-height}"
    padding: "0 1.25rem"
  button-coffee-hover:
    backgroundColor: "{colors.coffee-hover}"
  button-coffee-cancel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-height}"
    padding: "0 1.25rem"
  button-quiet:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-height}"
    padding: "0 1rem"
  field-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-height}"
    padding: "0 1rem"
  segment-track:
    backgroundColor: "{colors.surface-hover}"
    rounded: "{rounded.pill}"
    padding: "4px"
  segment-active:
    backgroundColor: "{colors.segment-active}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-height}"
  list-row:
    backgroundColor: "{colors.surface}"
    height: "{spacing.control-height}"
    padding: "0.75rem 1rem"
---

# Design System: Café UNA Admin

This file is the standard for every admin screen. It is derived from shipped code (not plans). The approved reference screen is **Información página principal** (`src/Pages/Admin/InformacionPaginaPrincipal/InformacionPaginaPrincipal.jsx`, PO approved 2026-11-07). New admin work copies those patterns; anything marked **Legacy** in Migration status is migrated when its page is next redesigned, not copied.

Token source of truth: the admin blocks in `src/index.css` (`body.admin-route-active` light, `html.admin-theme-dark body.admin-route-active` dark). Frontmatter mirrors them; if they ever disagree, the CSS wins and this file gets fixed.

## Principles

1. **Quiet and operational.** Calm surfaces, one warm accent (coffee), small type. The work is scanning and editing, not decoration.
2. **One row, one action.** A list row is a single button. Do not repeat a filled button on every row.
3. **Content before chrome.** Name plus a one-line preview beats a card with a title and a dark button.
4. **Small type on purpose.** The app root is 18px (`font: 18px/1.6` on `:root`); the admin panel deliberately overrides to 14px body (user decision). Do not "fix" it back up.
5. **Tokens, not literals.** Colors come from `var(--admin-*)` so both themes work.
6. **Isolation.** Admin styling never touches `:root` or public storefront styles.
7. **Pill language is brand.** Buttons, inputs, tabs and tags are pills (`rounded-full`); PRODUCT.md forbids removing it without approval. Containers are 1rem or 0.5rem rounded, never pills.

## Tokens

Every token below exists in both themes (enforced by `src/styles/adminTokens.test.js`, which fails when a `var(--admin-*)` is used but not defined).

### Surfaces and text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--admin-bg` | `#fafafa` | `#0e1116` | Page canvas |
| `--admin-surface` | `#ffffff` | `#161b22` | Panels, inputs, modals |
| `--admin-surface-subtle` | `#f8fafc` | `#12161c` | Dropzone, quiet fills |
| `--admin-surface-hover` | `#f1f5f9` | `#21262d` | Row hover, segmented track |
| `--admin-segment-active` | `#ffffff` | `#343b45` | Active segment; must read raised above the track |
| `--admin-text-primary` | `#0f172a` | `#e2e8f0` | Headings, values |
| `--admin-text-muted` | `#475569` | `#94a3b8` | Labels, previews, secondary text |
| `--admin-text-decorative` | `#94a3b8` | `#64748b` | Non-text only (CSS comment: disabled/inactive icons, decorative indicators; shipped fields use text-muted for placeholders) |

`--admin-text-decorative` must never carry readable text.

### Accent (coffee)

| Token | Light | Dark | Documented contrast (from CSS comments) |
|---|---|---|---|
| `--admin-accent-coffee` | `#5c4038` | `#b88376` | Dark: 5.39:1 on `#161b22`, 5.90:1 on `#0e1116` |
| `--admin-accent-coffee-hover` | `#452e27` | `#c48f82` | n/a |
| `--admin-accent-coffee-soft` | `#f6efec` | `#2a1d19` | Selected-state fill. Light: `#0f172a` 15.7:1, `#475569` 6.7:1. Dark: `#e2e8f0` 13.2:1, `#94a3b8` 6.4:1 |
| `--admin-on-accent-coffee` | `#ffffff` | `#1a0f0c` | Light: 9.35:1 on `#5c4038`, 12.55:1 on `#452e27`. Dark: 5.86:1 on `#b88376`, 6.8:1 on `#c48f82` (white would fail) |

Text on a coffee fill always uses `--admin-on-accent-coffee`, never literal white.

### Color roles (one role, one color)

Black (`slate-950`) used to do four jobs (page primary, row action, selection, switch on) and disappeared on `#0e1116`. Each job now has its own role, defined as classes in `src/index.css` (scoped to `body.admin-route-active`, colors only, so each page keeps its own size and shape utilities). Never use `slate-950`, `bg-black` or literal `text-white` on an admin control.

| Role | Class / selector | Look | Light | Dark | Use |
|---|---|---|---|---|---|
| Primary | `admin-role-primary` | Coffee fill, `--admin-on-accent-coffee` text, hover = coffee hover | 9.35:1 | 5.86:1 | One per screen ("+ Nuevo producto", "Agregar fecha", "Registrar salida") |
| Quiet | `admin-role-quiet` | 1px `--admin-border-input`, transparent, primary text, coffee border on hover | 17.9:1 | 14.0:1 | Row actions (Editar, Stock) and secondary actions (Categorías, Historial de ventas) |
| Destructive | `admin-role-danger` | `--admin-status-danger-text` text and 1px border, transparent; hover tints with `--admin-status-danger-bg` | 6.5:1 | 9.2:1 | Desactivar, Inactivar, Rechazar, Eliminar |
| Positive | `admin-role-positive` | `--admin-status-success-text` text and border, transparent | 5.0:1 | 11.4:1 | Activar, Aprobar |
| Selected | `admin-role-selected` (unselected: `admin-role-surface`) | `--admin-accent-coffee-soft` fill, 1px `--admin-accent-coffee` border, primary text | 15.7:1 | 13.2:1 | Selected card or chip ("Todos los productos"); Puntos de venta now uses the segmented pills instead |
| Switch on | `body.admin-route-active .ui-switch__track.is-on` | Coffee track, `--admin-on-accent-coffee` thumb. Off: `--admin-border-input` track (4.8:1 light, 3.6:1 dark), `--admin-surface` thumb. Ratios are track vs surface, WCAG 1.4.11 needs 3:1 | 9.35:1 | 5.39:1 | Boolean settings (the product Destacado switch became the star toggle) |
| Status text | `admin-status-success`, `admin-status-danger`, `admin-status-neutral` | Status token text on its tinted background; always paired with a word | 4.6:1 minimum | 9.1:1 minimum | Activo/Inactivo, Entregado/Rechazado |

Rules: tinted pink/green pills with translucent fills are retired (they washed out in dark mode); destructive and positive actions are text plus border. A selected card never turns black or white, it keeps its text colors. Headings need an important text utility (`text-[color:var(--admin-text-primary)]!`) because the unlayered global `h1/h2` color beats Tailwind layers.

### Borders and focus

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--admin-border` | `#e2e8f0` | `#1e293b` | Decorative dividers and card borders |
| `--admin-border-subtle` | `#f1f5f9` | `#161f2e` | Hairlines |
| `--admin-border-input` | `#64748b` | `#64748b` | Input borders, >= 3:1 (WCAG 1.4.11); dark >= 3.6:1 on `#161b22` and `#12161c` |
| `--admin-focus-ring` | `#64748b` | `#94a3b8` | Light: 4.8:1 on `#ffffff`, 4.4:1 on `#f1f5f9`. Dark: 6.2:1 on `#161b22`, 5.0:1 on `#21262d` |
| `--admin-border-input-focus` | = focus ring | = focus ring | Border and outline read as one indicator |

### Status

| Token | Light | Dark |
|---|---|---|
| `--admin-status-success-bg` / `-text` | `#dcfce7` / `#15803d` | `rgba(6,78,59,0.4)` / `#6ee7b7` |
| `--admin-status-danger-bg` / `-text` | `#fee2e2` / `#b91c1c` | `rgba(136,19,55,0.4)` / `#fda4af` |
| `--admin-status-warning-bg` / `-text` | `#fef3c7` / `#b45309` | `rgba(120,53,15,0.35)` / `#fcd34d` |

Status is never color alone: pair with a word or number (see word counter, Usuarios status text).

### Shape and sizing

| Token | Value | Use |
|---|---|---|
| `--admin-control-radius` | `9999px` | Search and control fields |
| `--admin-radius-card` | `1rem` | Panels, cards |
| `--admin-radius-dialog` | `1rem` | Modals (`rounded-t-2xl` mobile sheet, `sm:rounded-2xl`) |
| `--admin-radius-popover` | `0.5rem` | Dropdowns, popovers |
| `--control-height` | `44px` (`:root`) | Minimum height of every interactive control |
| `--ui-btn-radius` | `999px` (`:root`) | Global button radius (applied with `!important`, see gotchas) |

Depth: flat with 1px borders. Only dialogs lift (`shadow-2xl` on the dialog panel, scrim `rgb(15 23 42 / 0.55)`); the active segment uses `shadow-sm`.

## Typography

Family: `Geist Variable` (stack in `--sans`). Admin body sets `font-size: 14px; line-height: 1.5; letter-spacing: -0.011em` and `--text-body: 14px` on `body.admin-route-active`. Root is 18px for the public site; admin sizes are px/rem tokens chosen deliberately small.

| Role | Size / weight | Source | Where |
|---|---|---|---|
| Page title | `--text-title` clamp(1.65rem, 2.2vw, 2rem) / 700 | `:root` var; `h1` also forced to 1.25rem/600 by admin scope rule | `h1` of a page panel |
| Modal title | `--text-subtitle` 1.05rem / 700 | `AdminModalHeader` | Modal `h2` |
| Body, row name, button | `--text-body` 14px / 600 for names, 700 for primary buttons | `body.admin-route-active` | Rows, buttons, inputs |
| Field label | 13px / 600, muted, sentence case | `AdminCampo` | Above each field |
| Fieldset legend | `--text-body` / 700, primary | `AdminFieldset` | Group title in modals |
| Table cell | 13px, tabular numerals | `.admin-table-shell tbody td` | Data tables |
| Table button text | 12px / 500 | same | Buttons inside cells |
| Input text | 13.5px | `body.admin-route-active input, select` | Native inputs (the shared field class uses `--text-body`) |
| Caption, hint, counter, preview line | `text-xs` (0.75rem, about 13.5px at the 18px root) | components | Hints, counter, row preview |

Rules:

- **Sentence case labels.** No all-caps letter-spaced labels or kickers in new work.
- **Tabular numbers** for counts, row numbers, counters (`tabular-nums`).
- Row preview is one line, truncated; row name clamps at 2 lines.

## Layout & Responsive

Shell: `AdminLayout` (sticky 56px header, `<main>` padding `p-4 pb-10 md:p-6 md:pb-12`). A page is one panel: `rounded-2xl` bordered `section`, title block with bottom divider, toolbar block, list.

Check every screen at **375, 768, 1024, 1440** px.

| Pattern | < sm (640) | sm to lg | lg (1024) | xl (1280) |
|---|---|---|---|---|
| Toolbar | Stacked, tabs below search (`flex-col-reverse`) | Stacked | Stacked | One row: tabs left, search right (max 22rem) |
| Segment labels | Short label (e.g. "Pie") | Short label + count | Full title + count | Full title + count |
| List row | Icon-only edit button, no thumbnail, `px-4 gap-3` | Edit pill, 36px thumbnail, `px-6 gap-4` | same | same |
| Modal | Bottom sheet (`rounded-t-2xl`, max-h 92dvh), footer stacked, primary on top | Centered dialog, `max-w-xl`, footer split | same | same |
| Two-field groups | One column | Two columns (`sm:grid-cols-2`) | same | same |
| Users table | Stacked article list (`md:hidden`) | Table from md (`.admin-table-shell`, `hidden md:block`) | same | same |

Spacing rhythm: modal fields `gap-4` within a group, groups separated by a 1px divider with `pt-5`, label to control `gap-1.5`, body `px-3 py-3 sm:px-4 sm:py-4`.

## Components

### Editorial list row (approved reference)

Code: `src/Components/Admin/ui/AdminSeccionFila.jsx` (used in `InformacionPaginaPrincipal.jsx`, wrapped in `<ul class="divide-y divide-[var(--admin-border)]">`).

- **Anatomy:** number (right-aligned, `w-5`, muted, tabular) / icon chip (`size-8`, `rounded-lg`, 10% coffee tint, coffee icon `size-4`, stroke 1.75) / name (14px semibold, max 2 lines) over one-line preview (`text-xs`, muted, truncated; italic "Sin contenido" when empty) / 36px thumbnail (`size-9`, `rounded-md`, bordered; hidden below `sm`) / quiet **Editar** pill (outline, muted text; icon-only `size-8` below `sm`).
- **The whole row is one `<button>`** with `aria-label="Editar {nombre}"`. The pill is `aria-hidden` and decorative; never nest another interactive element.
- **States:** hover = `--admin-surface-hover` background; pill turns coffee on row hover and on keyboard focus; focus ring is inset (`outline-2 -outline-offset-2`) so it is not clipped by the list.
- **Do:** keep the preview to one line; hide thumbnails below `sm`. **Don't:** add per-row filled buttons, centered card grids, or pagination.
- The hide/show for the thumbnail lives on a wrapper `span`, not the `<img>` (see gotchas).

### Segmented control tabs (approved reference)

Code: `SegmentoSeccion` and the `role="tablist"` block in `InformacionPaginaPrincipal.jsx`; tokens `--admin-segment-active`, `--admin-surface-hover`.

- **Anatomy:** pill track (`rounded-full`, 1px `--admin-border`, `--admin-surface-hover` fill, `p-1`), three equal columns below xl (`grid grid-cols-3`), content width at xl (`xl:flex xl:w-fit`). Each segment is a 44px pill with label and a count (count hidden below `sm`).
- **States:** active = `--admin-segment-active` fill, 1px border, `shadow-sm`, semibold, primary text; inactive = transparent border, muted text, primary on hover; focus ring 2px offset 0.
- **Labels:** short label below `lg` (`<span class="lg:hidden">`), full title from `lg`. The accessible name is always the full title plus count (`aria-label`).
- **ARIA and keyboard:** `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabIndex` (active 0, others -1). ArrowRight/ArrowLeft wrap, Home/End jump to ends.
- **Use for:** small fixed indexes (about 2 to 6 groups). **Don't:** use pagination for these.
- Rounded corners need `rounded-full!` (important) because of the global button rule.

### Location selector: pills up to 6, combobox above (master-detail)

Code: `src/Pages/Admin/PuntosVenta/components/PointOfSaleLocationSelector.jsx` (threshold constant `LOCATION_PILLS_MAX = 6`), used by `/admin/puntos-venta`. Use it for any "pick one record, then work on its detail" screen whose list can grow.

- **Few (1 to 6): segmented pills.** Same look as the segmented control tabs (track, `--admin-segment-active` raised pill, `shadow-sm`, no coffee fill, no colored borders). Each pill is name plus a 8px status dot (`StatusDot`: success text color when active, `--admin-border-input` gray when inactive). The dot is decorative; the accessible name carries the status (`aria-label="FUNDA-UNA, activo"`). Inactive pills use muted text. Below `sm` (and whenever the pills do not fit) the track scrolls horizontally with `snap-x`; the scrollbar is hidden (`.pv-pills`). ARIA: `tablist` / `tab` with `aria-selected`, roving `tabIndex`, Arrow/Home/End (wrapping, selecting on focus), tabs `aria-controls` the detail region, which is the `tabpanel` labelled by the active tab.
- **Many (more than 6): searchable combobox.** A 44px pill trigger "Punto de venta: {name} (dot)" (`aria-haspopup="listbox"`) opens a popover with a search field (`role="combobox"`, `aria-controls`, `aria-activedescendant`, accent-insensitive match on name and code) and a `listbox` of options (dot, name, code, check on the current one; option accessible name includes the status). Keyboard: ArrowUp/Down and Home/End move the active option, Enter selects, Escape closes and returns focus to the trigger, Tab and outside press close. The detail region is a labelled `region`, not a `tabpanel`.
- **One panel, no boxes in boxes.** Selector, selected-record header, toolbar and table share one bordered `rounded-2xl` panel separated by 1px `--admin-border` dividers. The panel must not use `overflow-hidden` (it would clip the popovers); only the detail body clips its own rounded bottom corners.
- **Container queries, not viewport breakpoints.** The admin sidebar eats about 290px at 768 to 1279, so the panel is `@container` and its internals switch at container widths: table from `@xl` (576px), toolbar in one row from `@2xl`, header actions inline from `@lg`.

### Overflow menu and destructive confirmation

Code: `src/Components/Admin/ui/AdminOverflowMenu.jsx`, used by `PointOfSaleLocationHeader.jsx`.

- Icon-only 44px ghost "..." trigger (`aria-label` names the record, `aria-haspopup="menu"`, `aria-expanded`). Items are `role="menuitem"` buttons or router links (`to`/`params`), 44px high, primary text. Opening focuses the first visible item (items hidden by responsive classes are skipped); ArrowUp/Down wrap, Home/End, Escape closes and returns focus to the trigger, selecting an item closes and returns focus, outside press and Tab close.
- **Destructive text lives only inside the menu** (danger text color, no border, no fill). The visible page never shows a red or green button; the one coffee primary stays in the page header.
- **Inactivate asks first:** the menu item opens `AdminModal` (max-w-md) with an icon header ("Inactivar {name}"), a plain consequence line, Cancelar on the left and a filled danger primary "Inactivar" on the right (the only filled danger in the flow, inside the modal). Activar is non-destructive and runs immediately.
- Secondary actions collapse: at container width below `@lg` "Historial de ventas" moves from a quiet text link into the menu.

### Stock table rows (Puntos de venta)

Code: `PointOfSaleStockTable.jsx`. Identity column first (40px thumb plus name), Peso, Estado as a dot plus neutral muted word (never green or red text), Stock right-aligned, bold, `tabular-nums`. Low stock (existing `POCAS_UNIDADES_MAX` rule in `productoDisponibilidad.js`) adds an amber dot and the word "Bajo" (or "Agotado" at zero); amber is used for nothing else on the screen. The only per-row control is an icon-only ghost pencil (`aria-label="Editar stock de {producto}"`, 44px); the whole row also opens the same editor, and the pencil stops propagation so one click never fires twice. Below `@xl` rows become compact list items (thumb, name over "peso · estado", stock, pencil).

### Product rows and the star toggle (Productos)

Code: `src/Pages/Admin/InventarioProducto/components/` (`ProductCatalogTable`, `ProductFeaturedStar`, `ProductRowActions`, `ProductDeactivateConfirm`). Shared pieces reused from Puntos de venta: `Components/Admin/ui/StatusDot`, `StockCell`, `ProductThumb`, `AdminOverflowMenu`, `AdminFilterToolbar`.

- **Columns:** Producto (40px thumb, name semibold, category muted on a second line), Precio (right, tabular), Stock (right, `StockCell`: amber dot plus "Bajo" or "Agotado" via the existing threshold), Estado (`StatusDot` plus neutral muted word "Activo" or "Inactivo"), Destacado (star), actions. There is no Img column and no colored status words. Sort lives on the Producto, Precio and Stock headers (lucide chevrons, never unicode arrows).
- **Row controls: at most three.** Star, quiet ghost **Ajustar stock** (icon plus text from `@4xl`, icon-only below with `aria-label` and `title`; it is the most frequent action) and the `AdminOverflowMenu` with Editar and Desactivar/Activar. Danger text exists only inside the menu. The whole row opens Editar; the star, Ajustar stock and the menu stop propagation, and they are the keyboard path.
- **Star toggle:** a 44px ghost button. Featured = filled coffee star, not featured = outline muted star, `aria-pressed`, name "Destacar {producto} en inicio" or "Quitar {producto} de destacados". Coffee is used for the star and the one page primary, nothing else on the row. When it cannot be turned on (3 featured already, product inactive or out of stock) it is `disabled` and the reason is both `title` and an `sr-only` description linked with `aria-describedby` ("Máximo 3 destacados"). A featured product can always be un-featured.
- **Overflow items with a reason:** `AdminOverflowMenu` items accept `hint`; a disabled item (Desactivar on a featured product) shows the hint under it at full contrast and links it with `aria-describedby`.
- **Desactivar asks first** (`AdminModal` max-w-md, filled danger confirm via `adminBtnDangerPrimary`, the only filled danger in the flow); Activar runs immediately.
- **Responsive (container queries):** table from `@xl`; below it compact rows: thumb, name over "Categoría, dot, estado", price over stock on the right, star, menu. Ajustar stock moves into the menu there. Toolbar: with three selects the search takes its own row until `@4xl`; selects use their unset label as the trigger text ("Estado", "Destacado") so they fit two per row at 375.

### Toolbar

Code: toolbar block in `InformacionPaginaPrincipal.jsx` (search with clear button); `AdminFilterToolbar.jsx` is the compact container-query toolbar (search plus selects, count line only while filters are active) used by Puntos de venta and Productos; `AdminListaToolbar.jsx` is the older labelled toolbar still used elsewhere.

- One row at xl (tabs left, search right, `xl:max-w-[22rem]`); stacked below, tabs under the search (`flex-col-reverse`).
- Search: 44px pill, `--admin-border-input`, leading search icon, clear button (`size-9`, `aria-label`) appears only with an active query. Empty result uses `AdminListaVacia` with a "clear filters" action.

### Modal anatomy (approved reference)

Code: `src/Components/Admin/ui/AdminModal.jsx` (`AdminModal`, `AdminModalHeader`, `AdminModalBody`, `AdminModalFooter`, `AdminModalActions`).

1. **Header** (`AdminModalHeader icon title titleId description onClose`): coffee icon (20px), `h2` title (truncated), muted one/two-line description, 44px circular close button with `aria-label`. `titleId` pairs with `AdminModal labelledBy`.
2. **Body** (`AdminModalBody cms`): scrolls; contents grouped by `AdminFieldset`.
3. **Fieldset** (`AdminModalCampos.jsx`): legend in `--text-body` bold; groups separated by a 1px divider; fields in a `gap-4` grid. Omit the legend when a modal has a single group.
4. **Field** (`AdminCampo`): sentence-case 13px semibold muted label, optional counter right-aligned on the label row, control, optional hint (`text-xs`, muted, linked by `aria-describedby`).
5. **Word counter** (`ContadorCampo`): "3/8 palabras", muted at rest; **warning** text color from 90% of the limit, **danger** text color and semibold at 100%. Numbers stay visible (not color-only). `data-estado` = `normal | cerca | limite`.
6. **Image block** (`CmsImageField variant="bloque"`, `src/Components/ui/CmsImageField.jsx`): one block. With an image: 16:7 preview plus quiet **Reemplazar** and **Quitar**. Without: dashed dropzone. The raw URL input hides behind a **Usar URL** `<details>` disclosure.
7. **Preview** (`AdminEditorConPreview variant="modal"`, `AdminCmsPreview.jsx`): compact; a quiet **Previsualizar** button top-right, no "Edición" eyebrow and no help box (help text lives in the header).
8. **Footer** (`AdminModalFooter` + `AdminModalActions variant="coffee"`): Cancelar left, **Guardar cambios** coffee right; stacked below `sm` with primary on top (`flex-col-reverse`).

Dialogs are native `<dialog>` (`src/Components/ui/ModalDialog.jsx`), so focus trap and Escape come for free. Pending work disables the primary button (`guardando || subiendoImagen`).

### Buttons

| Variant | Export (`AdminModal.jsx`) | Look | Status |
|---|---|---|---|
| Coffee primary | `adminBtnCoffeePrimary` | Coffee fill, `--admin-on-accent-coffee` text, bold, 44px pill | Reference |
| Coffee cancel | `adminBtnCoffeeCancel` | Transparent, `--admin-border-input` outline, muted text | Reference |
| Quiet | `adminBtnQuiet` | Outline, muted text, coffee border and text on hover | Reference |
| Page primary / quiet / danger / positive | `admin-role-*` classes (see Color roles) | Coffee, outline, danger and success text with border | Reference (page-level buttons) |
| Black primary / cancel | `adminBtnPrimary`, `adminBtnCancel` | `slate-950` fill, default of `AdminModalActions` (also used by public /perfil pages) | Legacy default (kept; opt into `variant="coffee"`) |
| Voluntariado | `adminBtnVoluntariadoPrimary`, `adminBtnVoluntariadoCancel` | Black variant for CMS editors | Legacy |

New looks are opt-in variants (`variant="coffee"`); shared defaults stay unchanged.

### Fields

Code: `src/Components/Admin/ui/adminCampoStyles.js`. `adminCampoInputCls`: 44px pill, `--admin-border-input`, `--admin-surface` fill, 14px text, muted placeholder. `adminCampoAreaCls`: same but `rounded-2xl`, `py-3`, `resize-y`. Focus: border takes the ring color plus 2px outline, offset 0. Disabled: 60% opacity.

### Usuarios table (approved reference for data tables)

Code: `src/Pages/Admin/Usuarios/Usuarios.jsx`, shell `.admin-table-shell--usuarios` in `src/index.css`.

- **Identity column first:** name over email, truncated.
- **Roles and status are plain text, not chips:** role = `text-xs`, medium weight (SuperAdmin amber and semibold); status = `text-xs` semibold, "Habilitado" green / "Deshabilitado" red. Word always present.
- Header cells are left-aligned with fixed `0.75rem 1rem` padding, first/last cell `1.5rem`; body cells 13px with tabular numerals. Row actions use `AccionesUsuario`. Mobile renders stacked `article` rows below md.

## Accessibility

- Target WCAG 2.1 AA. Contrast values are documented next to the tokens above.
- **Targets:** every interactive control is at least 44px (`--control-height`). Exceptions are small inline controls (`size-9` clear button, `size-8` icon-only row pill which lives inside a 44px row button).
- **Focus ring:** 2px, `--admin-focus-ring`, offset 0 (inset `-2` inside list rows so it is not clipped). The search box and sidebar get the same ring from a scoped rule in `index.css`.
- **Dialogs:** native `<dialog>`, `aria-labelledby` via `titleId`, Escape closes, scroll locked via `useAdminModalLock`.
- **Labels:** every field has a `<label htmlFor>` (via `useId`); hints and counters are in `aria-describedby`; icon-only buttons have `aria-label`.
- **Tabs:** full ARIA tab pattern plus arrow/Home/End keys (see Segmented control).
- **Color is never the only signal:** counters show numbers, statuses show words.
- Decorative icons and thumbnails are `aria-hidden` / `alt=""`.

## Implementation rules & gotchas

1. **Scope to admin.** Admin CSS goes under `body.admin-route-active` (dark: `html.admin-theme-dark body.admin-route-active`). Never edit `:root` or public styles for admin work.
2. **Token parity.** Every `var(--admin-*)` must be defined in both theme blocks. `adminTokens.test.js` fails otherwise. Runtime-only tokens (`--admin-theme-x/y/r`) are allow-listed there.
3. **Unlayered global CSS beats Tailwind layers.** `index.css` has `button { border-radius: var(--ui-btn-radius) !important }` and `img { display: block }`, both outside Tailwind layers. Therefore: use important utilities (`rounded-full!`) when a button needs a specific radius, and hide/show images via a **wrapper element**, not `hidden` on the `<img>`.
4. **Shared components keep their defaults.** New looks are opt-in props or variants (`variant="coffee"`, `variant="bloque"`, `variant="modal"`). Do not restyle a shared default for one page.
5. **i18n.** All user-facing text goes through `<ST>` or `useTraducir`, backed by `src/lib/traducir.js`. Spanish is the source text; never hardcode English. Short tab labels also go through `<ST>`.
6. **Admin-only boundary.** No changes to public pages or backend during admin redesign.
7. **No raw `!important` in views** except the documented global-conflict cases above.
8. **Verify** at 375/768/1024/1440, in light and dark, with keyboard only.

## Do / Don't

| Do | Don't |
|---|---|
| One row = one button; quiet Edit pill as affordance | A filled black button repeated on every row |
| Segmented tabs for small fixed indexes | Pagination for 2 to 6 groups |
| Rows in a divided list inside the panel | Centered card grids for lists |
| Sentence-case 13px labels | All-caps letter-spaced labels or kickers |
| Coffee primary for the one save action | Black primary as a new default |
| `var(--admin-*)` tokens | Literal slate/white utilities (`bg-white`, `text-slate-600`) in new code |
| Status as text with a word | Status as color or chip alone |
| 2px ring, offset 0 | Removing outlines, or ring colors outside the token |

## Migration status

| Pattern / file | Status | Note |
|---|---|---|
| `AdminSeccionFila`, segmented tabs, toolbar in `InformacionPaginaPrincipal` | **Approved reference** | Copy these |
| `AdminModal` header props, `AdminModalActions variant="coffee"`, `AdminModalCampos`, `adminCampoStyles` | **Approved reference** | |
| `CmsImageField variant="bloque"`, `AdminEditorConPreview variant="modal"` | **Approved reference** | |
| Usuarios table identity column, plain-text roles/status | **Approved reference** | Role chip classes in the form (`colorRol`/`claseRol`) remain in code |
| `AdminSeccionCard` (`src/Components/Admin/ui/AdminSeccionCard.jsx`) | **Legacy, to migrate** | Used by `InformacionSobreNosotros.jsx`; replace with `AdminSeccionFila` |
| Black `adminBtnPrimary` default in `AdminModalActions` | **Legacy, to migrate** | Pages opt into `variant="coffee"` as they are redesigned |
| `adminBtnVoluntariado*`, `AdminEditorConPreview` default variant | **Legacy, to migrate** | Black buttons and "Edición" eyebrow |
| Uppercase tracked table headers (`.admin-table-shell thead th`: 11px, `0.05em`, uppercase) | **Legacy, to migrate** | Contradicts sentence-case rule; not copied into new components |
| Color roles (`admin-role-*`, `admin-status-*`, switch) on the 10 inventory pages, Usuarios, Voluntariado, Visitas, Donaciones, Equipo, Propuestas, Panel StockAlerts | **Migrated (PR 4)** | Black fills replaced by roles |
| Puntos de venta master-detail (`PointOfSaleLocationSelector`, `AdminOverflowMenu`, one-panel layout, dot statuses) | **Implemented (user-approved design)** | Replaces the card grid; `PointOfSaleCards` removed. Toolbar is `PointOfSaleToolbar` (count line only while filters are active) |
| Productos list (`ProductCatalogTable` identity rows, star toggle, overflow menu, deactivate confirmation, `AdminFilterToolbar`) | **Implemented (user-approved design)** | Replaces the four-button rows and the Destacado switch; `ProductActions`, `ProductCatalogMobileList` and `ProductCatalogFeaturedToggle` removed |
| `AdminSeccionCard`, `AdminModal` black defaults, `InformacionPaginaPrincipal` image badge, Sidebar scrim | **Left on purpose** | Shared defaults or non-control surfaces |
| Remaining hardcoded Tailwind color utilities and `adminDark.css` `!important` overrides | **Legacy, to migrate** | Move to `--admin-*` tokens |
| Other admin pages (toolbars, `AdminPaginacion`, old cards) | **Not yet reviewed** | Follow this file when touched |

## Public site

The public site is redesigned page by page under one system, "Café de origen, institucional". It is separate from the admin system above: tokens are prefixed `--pub-*` and live in `src/styles/publicSystem.css` (dialogs and form pieces in `src/styles/publicDialog.css`). Admin tokens and existing `:root` values are never changed.

### Tokens

| Role | Token | Value |
|---|---|---|
| Titles | `--pub-ink` | `#2a1612` |
| Body text | `--pub-text` | `#2a1612` |
| Muted text (6.4:1 on canvas) | `--pub-text-muted` | `#6b5a52` |
| Action color (the only one) | `--pub-coffee` / `--pub-coffee-hover` | `#5c4038` / `#452e27` |
| Selected fill | `--pub-coffee-soft` | `#f6efec` |
| Borders | `--pub-line` | `#e9e2da` |
| Quiet button border | `--pub-line-strong` | `#b9aaa0` |
| Input border (3:1 or better) | `--pub-input-border` | `#8a7b72` |
| Page / surface | `--pub-canvas` / `--pub-surface` | `#fbf9f6` / `#ffffff` |

### Page background (one switch)

The shared public layout (`.site-shell`: Navbar + `#center.site-main` + Footer, covering every public page that is not chromeless) paints `var(--pub-page-bg)`. It is set in `src/styles/publicSystem.css`:

```css
--pub-page-bg: var(--pub-canvas); /* change to #ffffff to revert the site to white */
```

### Title font (one switch)

Page (`h1`) and section (`h2`) titles inside `.site-shell` use `var(--pub-font-display)`, weight 600, letter-spacing -0.015em (navbar, footer and small uppercase kickers keep Geist). Revert by editing the token in `src/styles/publicSystem.css`:

```css
--pub-font-display: var(--sans); /* currently "Source Serif 4 Variable", Georgia, serif */
```

Cards, panels, inputs, dialogs and the navbar stay white. Admin, perfil, login/registro and checkout are outside this layout and unaffected.

### Type

- Geist for all UI. Source Serif 4 (self-hosted with `@fontsource-variable/source-serif-4`; the Netlify CSP blocks Google Fonts) only for page titles and section or dialog titles: weight 600, letter-spacing `-0.02em`, class `pub-serif-title`.
- Sentence case everywhere. No uppercase letter-spaced kickers or eyebrows.

### Buttons

Three levels, all pills of 44px or more (`pub-btn`):

- `pub-btn--primary`: coffee fill, white text. One per page.
- `pub-btn--secondary`: white, 1px `--pub-line-strong` border, ink text.
- `pub-btn--link`: coffee underlined text.
- `pub-btn--icon` makes a secondary button a 44px square-hit icon button; it needs an `aria-label`.

No black or slate-900 buttons on public pages. `index.css` forces the pill radius on any class containing `btn` and a 16px radius on classes containing `card`, `panel` or `modal`; use those names on purpose and avoid new `!important`.

### Layout and containers

- `pub-container`: max-width 1200px, 24px side padding (16px on phones). `pub-page`: canvas background.
- Cards and panels (`pub-panel`): white, 1px `--pub-line` border, 16px radius, no heavy shadow.
- Two-column pages use `flex-wrap` (sidebar about 230px, content `flex: 999 1 560px; min-width: 0`) instead of breakpoints.

### PublicPageHeader

`src/Components/Public/PublicPageHeader.jsx`: serif `h1`, one muted line, optional actions slot, 1px bottom divider. On phones the actions stack full width.

### List row

Divided `<ul>` inside one `pub-panel`, no card grid. Row = 40x52 file-type tile (`--pub-coffee-soft`, label PDF/DOC/XLS/IMG/ZIP, `aria-hidden`), 17px semibold title that opens the item, one muted meta line with middle dots (missing parts omitted), then a secondary "Ver" pill and an icon-only action. On phones only the icon action stays. Reference: `src/Pages/Repositorio/components/DocumentoFila.jsx`.

### Dialogs and forms

- Native `ModalDialog` with `className="pub-dialog-overlay"` and a `pub-dialog` box: white, 640px max, header with serif title + muted line + 44px close button, footer with secondary action left and primary right. On phones the dialog is a bottom sheet and the footer stacks with the primary on top.
- Fields are grouped in `fieldset`/`legend` (`pub-fieldset`), sentence-case 15px labels, `*` for required, "(opcional)" for optional, 44px pill inputs with `--pub-input-border`, 16px radius textareas. Hints are 14px muted text.
- Notes (for example visibility) use `pub-note`: `--pub-coffee-soft` box with a drawn icon. No emoji or glyph icons.

### Migration status

| Page | Status |
|---|---|
| Repositorio (page, submission dialog, viewer) | **Implemented** |
| Formularios (voluntariado, visitas, donaciones, propuestas) | Pending (1) |
| Productores / Sobre nosotros | Pending (2) |
| Área del cliente | Pending (3) |
| Inicio / Checkout | Pending (4) |

The document viewer (`VisualizarDocumentoModal`) is also used by the admin document screens, so it follows the public system there too.
