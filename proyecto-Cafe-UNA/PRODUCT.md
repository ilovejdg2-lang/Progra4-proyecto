# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are **Admin** and **Super Admin** operators managing the institutional and commercial backoffice of Café UNA (Universidad Nacional de Costa Rica). They manage daily end-to-end administration across multiple operational domains:
- User management, role access, and vendor point-of-sale assignments.
- Product catalog and inventory balances across warehouses and retail points of sale.
- Physical asset tracking and purchase/requisition requests.
- Institutional content management (homepage, about section, team, image galleries).
- Volunteer program applications, campus visitor scheduling, and community donations.

## Product Purpose

Provide a centralized, robust, and reliable administrative control center for Café UNA. Success means administrators can execute dense, mission-critical operations—such as updating stock, auditing users, verifying identity records, and managing logistical schedules—accurately, rapidly, and without visual clutter or cognitive fatigue.

## Positioning

An institutional university-enterprise backoffice tailored to Café UNA's hybrid mission: managing commercial coffee retail and distribution while coordinating academic, volunteer, and community engagement initiatives of the Universidad Nacional.

## Operating Context

Desktop-first administrative workstation environment (with responsive mobile support for handheld operational reviews). Users conduct sustained operational work characterized by:
- High data density: large tabular callouts, multi-criteria filtering, and paginated record sets.
- Strict validation rules: Costa Rican national identification (cédula física y jurídica) formatting, phone sanitization, and password policies.
- Modal-heavy workflows: creation, editing, and nested sub-entity assignments handled inside dialogs.
- Bilingual localization: default Spanish UI with real-time Spanish/English switching.

## Capabilities and Constraints

- **Stack**: React 19, Vite 8, Tailwind CSS v4, Radix UI primitives, @tanstack/react-router, @tanstack/react-table, @tanstack/react-form.
- **Scope Restriction**: Work is strictly confined to frontend admin boundaries (`src/Pages/Admin/**`, `src/Components/Admin/**`, `src/styles/adminDark.css`, and admin-specific styles in `src/index.css`). No backend changes, no database access, and no `.env` reading.
- **Theme Scoping**: Dual theme (light and dark mode). The `:root` token set in `src/index.css` is global and shared with the public e-commerce storefront; all admin-specific custom properties must be scoped strictly under `body.admin-route-active`.
- **Form & Shape Constraints**: The pill shape (`rounded-full`) is prevalent across buttons, search bars, and badges and represents incumbent brand styling; it must not be removed or altered without explicit approval.
- **Accessibility Invariants**:
  - Native `<dialog>` primitive used for modals via `AdminModal` (`src/Components/ui/ModalDialog.jsx`), preserving keyboard focus trapping and Escape handling.
  - Form labels bound via `htmlFor`/`id` or `useId`.
  - Icon buttons require accessible `aria-label` or visible accessible text.
  - Color must not be the sole conveyor of status.
- **Localization Invariants**: The UI is in Spanish with an ES/EN toggle. New text must use `<ST>` or `useTraducir` referencing `src/lib/traducir.js`. Never hardcode English strings in the UI.

## Brand Commitments

- **Name**: Café UNA (Universidad Nacional).
- **Brand Identity**: Warm, grounded coffee institution combined with structured, professional administrative tooling.
- **Public Surface Isolation**: Public storefront visuals and global styles must remain completely untouched during admin redesign work.

## Evidence on Hand

- 42 admin routes registered under `@tanstack/react-router`.
- Shared admin UI kit: `AdminLayout` (used in 32 files), `AdminModal` (used in 29 files), `AdminListaToolbar` (used in 17 files), `AdminPaginacion` (used in 14 files).
- Theming implementation: `src/index.css` (Tailwind 4 + shared public variables) and `src/styles/adminDark.css` (573 lines with 59 scoped `!important` override rules).
- Automated test suite baseline: 480 passing Vitest tests, ESLint baseline of 261 pre-existing issues, and react-doctor score of 71/100 (0 errors).

## Product Principles

1. **Ergonomic Density Over Visual Clutter**: Admin workflows demand high information density, but controls must feel spacious, comfortable, and orderly rather than cramped and overwhelming.
2. **Predictable Layout and Component Sizing**: Standardize control heights, input fields, paddings, and alignment to eliminate visual jumpiness and eye fatigue during prolonged use.
3. **Strict Non-Regressive Scope**: Admin enhancements must be strictly encapsulated so they never bleed into or destabilize the public-facing storefront.
4. **Resilient Accessibility and Keyboard Flow**: Fast tab navigation, visible focus indicators, and accessible dialogs are mandatory operational standards, not optional polish.

## Accessibility & Inclusion

- Target WCAG 2.1 Level AA conformance.
- Minimum 44px touch targets on interactive controls (`--control-height: 44px`).
- High-contrast text against light and dark surfaces, especially inside status chips, table headers, and form inputs.
