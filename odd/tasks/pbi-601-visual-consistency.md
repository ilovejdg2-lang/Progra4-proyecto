# PBI 601 — Visual consistency

## Objective and authorization
Implement Azure Sprint 4 tasks #602 (image intake), #603 (calendar consistency), and #604 (dark notification contrast), assigned to Brayan, under PBI #601.
The user authorized implementation in the latest message: they selected GPT-6.1 Sol medium so the assistant can perform these tasks.
Source repository: Frontend/Progra4-proyecto.
Feature branch: feat/601-visual-consistency, starting at development 10651a8560e7cc618f21789a2c05d0292baf6fdc.

## Problem and evidence
- Image inputs have inconsistent drag/select behavior; some CMS and profile editors accept only URLs.
- Existing product image upload is immediate and 10 MB; producer image files are retained until submission and limited to 5 MB. These contracts cannot be conflated.
- Native date inputs coexist with the existing shared Spanish Calendar; some controls permit historical dates, others forbid past dates.
- Notification cards have hardcoded light backgrounds while dark-theme rules lighten their titles, producing unreadable text.
- Read-only mapping completed with CodeGraph first. Existing index has stale/omitted entries, so current source was inspected directly where necessary.

## Scope and constraints
- Preserve existing upload endpoints, authentication/permissions, deferred versus immediate upload, optional URLs, file counts, type/size limits, and existing payload shapes.
- Reuse existing UI patterns and dependencies; Spanish UI copy follows the existing project's neutral/professional Spanish.
- Preserve per-domain date restrictions, ES/EN behavior where supported, optional/required/disabled state, and ISO date-string contracts without UTC day shifts.
- Preserve all notification fetching, groups, navigation, permissions, and portal behavior.
- Do not change backend behavior, database schema, credentials, production data, or unrelated features.
- Profile verification found no file-upload endpoint: GET/PUT /api/perfil only read/update image URLs under ver_perfil_propio/actualizar_perfil_propio. CMS POST /api/informacion/imagenes requires actualizar_informacion (admin seed). Do not reuse that uploader for ordinary profile users or broaden permissions. A separate authorized backend-capability decision is pending for this part of #602.
- No push, PR creation, merge, Azure state transition, remote application request, or database migration is authorized by this implementation run.
- Source changes are limited to T602.1a producer creation and its shared image selector; backend untouched.

## Source map (app-relative unless marked backend)
App directory: proyecto-Cafe-UNA.
- Existing image pattern: src/Pages/Admin/InventarioProducto/components/ProductoImagenCampo.jsx; validator src/lib/productoImagenes.js.
- Producer image intake: src/Pages/Productores/PropuestaProductor.jsx; src/Pages/Productores/ModalEditarMiPropuesta.jsx; src/lib/propuestaProductor.js (5 MB/deferred files).
- Existing different upload contracts to preserve: src/Pages/Donaciones/SolicitarDonacion.jsx; src/Pages/Checkout/Checkout.jsx; src/Pages/Repositorio/SolicitarDocumentoModal.jsx.
- CMS image fields: src/Pages/Admin/InformacionPaginaPrincipal/InformacionPaginaPrincipal.jsx (hero/location/map); src/Pages/Admin/InformacionSobreNosotros/InformacionSobreNosotros.jsx (about/gallery); src/Pages/Admin/Equipo/EquipoEditor.jsx; uploader src/services/informacionService.js.
- Profile URLs: src/Components/Perfil/PerfilContent.jsx; src/services/perfilService.js. Backend evidence: Backend/cafe_una_backend/src/controllers/perfil.controller.ts, src/controllers/informacion.controller.ts, src/services/usuarios.service.ts and src/common/permisos-seed.ts. CMS uploads: multipart imagen, one file, 10 MiB, jpg/jpeg/png/webp extension check, relative URL response; authenticated admin permission.
- Calendar core: src/Components/ui/calendar.jsx and calendar.css (react-day-picker 10.0.1, date-fns 4.4.0, Spanish default, hardcoded 2025–2030 navigation).
- Date-filter integration: src/Components/Admin/ui/AdminListaToolbar.jsx; src/Pages/HistorialCompras/HistorialComprasCliente.jsx; src/Pages/Admin/Auditoria/Auditoria.jsx.
- Form date integration: src/Pages/Admin/ActivosFijos/ActivosFijos.jsx (historical purchase); src/Pages/Admin/SolicitudesCompra/SolicitudesCompra.jsx (estimated delivery); src/Pages/Admin/Voluntariado/Voluntariado.jsx; src/Pages/Admin/Visitas/GestionFechasVisitas.jsx.
- Verify reachability first: src/Pages/Admin/Visitas/DisponibilidadVisitas.jsx; src/Pages/Voluntariado/DatePickerWithRange.jsx (no callers found). Preserve display-only donation declaration date and dashboard event-calendar semantics.
- Active direct calendar: src/Pages/Admin/Ajustes/HorariosCalendario.jsx (past/weekend rules and local ISO parsing).
- Notifications: src/Components/Admin/AdminStockNotificationsBell.jsx; src/Components/Navbar/Navbar.css (light card backgrounds); src/styles/adminDark.css (light titles without dark card backgrounds); src/lib/adminTheme.js (root dark/admin-theme-dark, body admin-route-active; portal to body).

## Workflow and checks
- Route: delegated direct (not SDD). Mapping required 4+ source files; implementation involves multiple non-trivial files, so each implementation unit is assigned to a bounded writer.
- TDD: ON, explicitly confirmed by the user for #602–604. Order: finish #602 first, then #603, then #604. Require observed assertion-level RED before production changes, GREEN, then REFACTOR with the existing Vitest runner. Legacy OpenSpec flags are not changed and do not override this feature-specific instruction.
- Tests exist: Vitest, jsdom, Testing Library, user-event, jest-dom.
- Full tests from repository root: npm test.
- Focused tests from repository root: npm --prefix proyecto-Cafe-UNA test -- <test-file>.
- Build from repository root: npm run build.
- Lint from repository root: npm run lint.
- Browser verification: real rendered component/form behavior, keyboard operation, mobile/desktop, light/dark themes; do not access an authenticated remote backend without separate authorization.
- Baseline npm test: initial sandbox run failed at Vite/Tailwind startup with spawn EPERM; approved rerun outside sandbox executed successfully and reported 145 passed / 8 failed tests in 40 files (38 passed / 2 failed), exit 1, 111.97 s. Failures predate source edits and are in SalidaInventarioForm.test.jsx (7) and SalidasInventario.test.jsx (1); at least the Producto queries expect a native combobox, but current UI renders a custom button/listbox trigger. Do not fix unrelated inventory tests under this PBI without separate authorization. Baseline lint (before production edits): npm run lint reported 279 problems (261 errors/18 warnings), with no producer create/test paths in its output. Baseline build after approved EPERM rerun failed because installed dependencies cannot resolve declared recharts ^3.10.1 from UserStatusChart.jsx. No dependency installed or unrelated lint/test fixed. The build's ignored public/_redirects was regenerated from the normal environment after the local-only BACKEND_URL check.
- RDD: on, decided by default; global and clone-local unset. Initial empty-current-candidate assessment was unassessable (no pending changes); do not interpret it as low risk or an actual reviewed candidate. Reassess each real work-unit commit against the last reviewed boundary.
- Initial branch point: 10651a8560e7cc618f21789a2c05d0292baf6fdc. Last reviewed boundary: 4a5a35d9ed66022e6c7b9bdd662c97a27e7f6da7 (docs-only assessment: passive/non_executable_only; review_due false).
- Work units close only after observed checks and a Conventional Commit; no AI attribution.

## Delivery forecast
- Forecast: 1,000–1,580 authored additions + deletions including frontend tests, excluding generated output and the unresolved profile backend upload capability.
- Strategy: ask-on-risk (default).
- Chain strategy: feature-branch-chain, explicitly confirmed by the user. Keep small dependent delivery slices inside the PBI feature chain; eventually integrate into development only after verification. No push or PR publication yet. Tracker branch: feat/601-visual-consistency; first implementation child: feat/602-image-selection.
- One honest slice-planning pass; do not omit tests, compress code, or delete formatting to meet the advisory task size.
- Planned slice boundaries below are provisional until delivery strategy and contracts are resolved.
- Running authored count: 418 (119 tracker + 299 T602.1a). Active implementation child: feat/602-producer-edit-image, based on d035eb9; first slice feat/602-image-selection is 299 authored changed lines, second child will target it if publication is authorized.
- Commit/PR boundaries: tracker docs commit 4a5a35d (119 additions, diff --check passed; runtime N/A: documentation only). First child feat/602-image-selection starts at that tracker commit and will target feat/601-visual-consistency if publication is later authorized. No remote publication authorized.

## Implementation checklist

### T602.1 — Shared image selection and producer integration
- [x] Introduce/reuse a presentational image drag/select control without forcing an upload lifecycle.
- [x] Integrate producer create/edit image fields while preserving 5 MB validation and deferred File submission.
- [x] Test selection, drop, cancel, invalid type/size, replacement, loading/error, and keyboard behavior as applicable.
- Route: delegated; multiple non-trivial components/tests.
- Checks: focused image/control/producer tests, applicable full checks, browser verification.
- Rollback: control and its producer integrations/tests only.
- T602.1a producer CREATE and T602.1b producer EDIT implemented by bounded delegated writer.
- T602.1b observed RED UI: 1 failed (2.05 s), accessible picker absent; multipart RED: 2 failed/1 skipped (2.92 s), plain object was not FormData. GREEN editor 10 passed (2.49 s), combined CREATE/EDIT 19 passed in 2 files (2.99 s). Same Vitest command as CREATE with ModalEditarMiPropuesta.test.jsx.
- Required correctness fix: existing modal passed File as an ignored third service argument. Modal now supplies existing (id, FormData) contract; optional imagen and request-only motivo (not motivoCambio). Backend read-only confirmation: both routes use FileInterceptor('imagen'); request service reads body.motivo. No backend/service edits, API changes or migration. Optional replacement preserves existing image and discarding restores it; blob cleanup covered.
- Editor targeted lint has two existing react-hooks/set-state-in-effect errors, confirmed against HEAD; new editor test clean and previous unused X import removed. No new lint errors. Shared-component browser evidence applies; actual modal/backend E2E remains unverified, no credential reuse or live writes.
- T602.1b rollback: ModalEditarMiPropuesta.jsx and ModalEditarMiPropuesta.test.jsx only. Full suite after editor: 164 passed/8 failed in 42 files (24.53 s), same known inventory failures. Build remains blocked by missing installed recharts; not rerun after editor-only change. Commit/native assessment pending.
- TDD evidence: keyboard RED 1 failed/7 skipped (5.10 s), initial GREEN 8 passed (6.62 s); removal RED 1 failed/8 skipped (5.23 s); final GREEN 9 passed (11.05 s). Runner: npm --prefix proyecto-Cafe-UNA test -- src/Pages/Productores/PropuestaProductor.test.jsx; RED selections used -t keyboard and -t removes.
- Preserved deferred File/FormData, 5 MB, MIME OR extension, retry/idempotency; covered selection/drop/cancel/replacement/removal/blob cleanup/loading/error.
- Targeted ESLint: all three changed JSX pass, exit 0. Full suite: 154 passed/8 failed in 41 files (38.10 s); same two preexisting inventory test files fail, no new failures.
- Browser: local Vite 5191, isolated actual component fixture with CSP and no auth/services; Enter opens file chooser and synthetic PNG selection updates output. Clearing, disabled/error states and theme controls exercised; final dark mobile 320 px screenshot readable, document scrollWidth 305 <= 320, no captured console errors/warnings. This is NOT backend/storage E2E. Screenshot: C:/CAFE-UNA/pbi602-mobile-dark.png.
- Build: post-change npm run build fails resolving recharts from MonthlyRevenueChart.jsx (same missing installed dependency as baseline); no dependency installed. Redirect file regenerated from normal environment. Global lint baseline remains 279 problems; targeted lint clean.
- Rollback for T602.1a: ImageFilePicker.jsx, producer CREATE integration/test, test-fixtures/image-file-picker.html; leave editor/CMS/backend unchanged.
- Commit: d035eb99f50a00e0e88859f0dd8f5897b3b255b9 (257 additions/42 deletions; diff --check passed). Native assessment against 4a5a35d: medium/executable_change, review_due false, under_budget. Last reviewed boundary remains 4a5a35d; this pending slice is not approved/reviewed.

### T602.2 — CMS image intake consistency
- [ ] Integrate existing information image uploader into relevant hero, location, map, about, gallery, and team image fields while preserving optional URLs and save payloads.
- [ ] Preserve existing product, POS, donation, checkout, and mixed-document upload semantics; add regression coverage where touched.
- Route: delegated; multiple CMS forms and shared controls.
- Checks: focused CMS/upload regression tests, applicable full checks, browser verification.
- Rollback: CMS image-field integrations/tests only.
- Commit and evidence: pending.

### T602.3 — Profile image upload capability
- [ ] Verify the local backend contract and permissions for avatar/banner upload.
- [ ] If a suitable existing contract exists, integrate image intake with profile URL updates and regression tests.
- [ ] If absent or unsafe, report the dependency and request a product/backend scope decision rather than silently using an administrator uploader.
- Route: delegated exploration/writer; profile frontend and potentially a backend contract.
- Checks: contract/permission evidence, profile-focused tests, browser verification without live data mutation.
- Rollback: profile intake integration/tests only; no backend mutation unless separately resolved.
- Commit and evidence: pending.

### T603.1 — Shared date-only input
- [ ] Build/reuse a controlled single-date input over the existing Calendar.
- [ ] Preserve ISO date strings, optional/required/disabled/min/max contracts, local-date parsing, selecting and clearing, keyboard access, and usable navigation beyond hardcoded 2025–2030 where appropriate.
- Route: delegated; component, date helpers, tests/styles.
- Checks: focused date tests including leap/month/year/timezone boundaries; browser verification.
- Rollback: shared input/helper/tests only.
- Commit and evidence: pending.

### T603.2 — Calendar integrations
- [ ] Migrate active native date inputs/shared admin toolbar and active direct DayPicker usage to the common pattern.
- [ ] Preserve historical purchase dates, future-only policies where explicitly present, disabled declaration-date display, per-feature modifiers, and ES/EN behavior.
- [ ] Verify legacy page reachability before editing; do not rewrite the dashboard event calendar or unused components unnecessarily.
- Route: delegated; multiple forms and filters.
- Checks: affected form/filter regressions, full tests/build/lint, mobile/desktop browser checks.
- Rollback: date-input integrations/tests only.
- Commit and evidence: pending.

### T604 — Dark notification contrast
- [ ] Scope dark-theme background/border/title/detail/action/icon/section/focus styles to the existing admin theme.
- [ ] Keep the light theme, fetching, permissions, groups, and navigation unchanged.
- [ ] Verify actual rendered computed contrast and keyboard focus, including the portal in mobile/desktop layouts.
- Route: delegated; CSS plus regression/runtime tests.
- Checks: theme-focused tests, full tests/build/lint, real browser contrast proof.
- Rollback: notification dark-theme overrides/tests only.
- Commit and evidence: pending.

## Current status and next step
Tracker documentation committed as 4a5a35d. T602.1a committed as d035eb9 with TDD and local browser proof. Native review deferred under budget, not approval; no PR publication. Active child feat/602-producer-edit-image: T602.1b producer EDIT assigned to bounded delegated writer (component plus tests, TDD ON). #602 remains incomplete: producer EDIT, CMS and profile-capability decision still pending.
User confirmed TDD ON, order #602 -> #603 -> #604, and feature-branch-chain delivery without PR publication. Start #602 only: T602.1a covers the shared image selector plus producer creation, T602.1b covers producer editing; then T602.2 CMS integrations. T602.3 profile uploads remain pending a safe backend-capability decision. Preserve the eight known baseline inventory test failures without changing unrelated source/tests.
