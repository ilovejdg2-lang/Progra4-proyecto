# Tasks: Inventory Location Stock Foundation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–450 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 contract/services → PR 2 location UI → PR 3 verification |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Normalize location and scoped-stock contracts | PR 1 | `npm test -- --run src/services/productosService.test.js` | Backend `development` read endpoint with each canonical code | Revert service adapters and DTO tests only |
| 2 | Add selected-location administrative view | PR 2 | `npm test -- --run src/Pages/Admin/InventarioProducto` | `npm run dev`; inspect `/admin/producto` for each location | Revert selector, hook, and view wiring |
| 3 | Prove isolation, states, and ecommerce regression | PR 3 | `npm test` | `npm run dev`; exercise loading, empty, 403, retry, and POS selection | Revert verification changes without removing the feature |

PR 1 branch: `feature/inventory-f06-location-contract`, base `feature/inventory-f06-location-stock-foundation`, PR target `feature/inventory-f06-location-stock-foundation`.
PR 2 branch: `feature/inventory-f06-location-ui`, base `feature/inventory-f06-location-contract`, PR target `feature/inventory-f06-location-contract`.
PR 3 branch: `feature/inventory-f06-location-verification`, base `feature/inventory-f06-location-ui`, PR target `feature/inventory-f06-location-ui`.
Final promotion: tracker branch → `development` → `main`.

## Phase 1: Contract and Service Foundation

- [ ] 1.1 Confirm backend read paths, authorization response, and absent-row versus zero-row behavior; record fixtures for the four canonical codes.
- [ ] 1.2 Add `Location` and `LocationStock` normalization, scoped cache keys, and read methods in `src/services/productosService.js` without changing catalog payloads.
- [ ] 1.3 Add service tests for PascalCase/camelCase responses, invalid identities, cache isolation, absent stock, and explicit zero.

## Phase 2: Location-Scoped UI Integration

- [ ] 2.1 Create `src/hooks/useInventoryLocations.js` and `src/hooks/useLocationStock.js` with loading, empty, error, unauthorized, retry, and selection-reset states.
- [ ] 2.2 Create `InventoryLocationSelector.jsx` and wire code-backed selection into `InventarioProducto.jsx`, defaulting to `BODEGA_CENTRAL`.
- [ ] 2.3 Update table/mobile components to render only the selected location, announce its context, and omit POS editing controls.
- [ ] 2.4 Update `ProductActions.jsx` so central editing remains available while POS locations are read-only.

## Phase 3: Regression and Verification

- [ ] 3.1 Add component tests for four options, mixed-location isolation, loading, empty, error/retry, 403, and absent-versus-zero states.
- [ ] 3.2 Extend `productoDisponibilidad` tests to prove POS selection never changes ecommerce or featured-product decisions.
- [ ] 3.3 Run `npm test`, `npm run build`, focused ESLint, `git diff --check`, and manual checks for desktop/mobile `/admin/producto`.
