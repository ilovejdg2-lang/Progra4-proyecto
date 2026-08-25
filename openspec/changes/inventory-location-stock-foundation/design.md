# Design: Inventory Location Stock Foundation

## Technical Approach

Extend the existing `/admin/producto` surface with an explicit location selector and a location-scoped stock read model. Keep catalog state and stock state in separate hooks and service boundaries. The selected location changes only the administrative stock view; it must never overwrite `product.stock`, which remains the confirmed Bodega Central value consumed by ecommerce availability and featured-product rules.

## Architecture Decisions

### Decision: Reuse the existing inventory route

**Choice**: Add the location view to `/admin/producto` and keep TanStack Router unchanged.
**Alternatives considered**: A new `/admin/inventario/stock` route or client-side aggregation.
**Rationale**: Reuses the current admin shell, permissions, responsive table/list, and characterization tests while avoiding a false client-side inventory model. A dedicated route can be introduced later for transfers and movements.

### Decision: Normalize at the service boundary

**Choice**: `productosService.js` exposes canonical `Location` and `LocationStock` DTOs; components never read PascalCase or raw API fields.
**Alternatives considered**: Letting components normalize responses or reusing `product.stock`.
**Rationale**: One adapter protects the UI from backend casing changes and prevents POS quantities from leaking into catalog/ecommerce state.

### Decision: Query one location at a time

**Choice**: `useLocationStock(locationCode)` owns the selected-location request, cache key, retry, and status.
**Alternatives considered**: Fetching all locations and filtering in React.
**Rationale**: Makes scope explicit, reduces accidental cross-location rendering, and avoids stale values when the selection changes.

## Data Flow

```text
AdminInventarioProducto
  ├─ useProductCatalog() ───────────────→ catalogProducts
  ├─ useInventoryLocations() ───────────→ locations
  └─ useLocationStock(selectedCode) ────→ locationStocks
                         │
                         └→ ProductCatalogTable / MobileList
                            (selected location only)
```

On first render, load the location directory and default to `BODEGA_CENTRAL` by code. Selecting a location cancels or supersedes the previous request, clears the visible location rows while loading, and renders only records whose `locationCode` equals the selection. A missing row maps to `stock: null, confidence: "unknown"`; an explicit zero maps to `stock: 0, confidence: "known"`. The central DTO used for ecommerce remains independently loaded and unchanged.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `proyecto-Cafe-UNA/src/services/productosService.js` | Modify | Add location directory/read adapters, canonical codes, scoped cache keys, and preserve catalog payload exclusion. |
| `proyecto-Cafe-UNA/src/hooks/useLocationStock.js` | Create | Manage selected-location loading, success, empty, error, unauthorized, and retry states. |
| `proyecto-Cafe-UNA/src/hooks/useInventoryLocations.js` | Create | Load and expose the canonical location directory. |
| `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx` | Modify | Own selection and compose independent catalog, central, and selected-location state. |
| `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/InventoryLocationSelector.jsx` | Create | Accessible native selector with code-backed identity and visible context. |
| `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductCatalogTable.jsx` | Modify | Render only selected-location stock and label its scope; retain central-only featured rules. |
| `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductCatalogMobileList.jsx` | Modify | Mirror scoped stock and state messaging on mobile. |
| `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductActions.jsx` | Modify | Allow stock editing only for Bodega Central and expose location-aware labels. |
| `proyecto-Cafe-UNA/src/lib/productoDisponibilidad.js` | Modify/test | Assert that ecommerce availability reads only the central DTO. |

## Interfaces / Contracts

```js
Location = { code, name, kind, active }
LocationStock = {
  productId: string,
  locationCode: string,
  stock: number | null,
  confidence: "known" | "unknown"
}
```

Canonical codes are `BODEGA_CENTRAL`, `POS_FUNA_UNA`, `POS_EDITORIAL`, and `POS_STAND_FERIAS`. Read authorization is backend-owned; the UI uses `ver_inventario` for page access and presents a non-authorized state on `403` without inventing location-specific permissions. `actualizar_stock_productos` remains limited to the existing central editor; POS editing is absent.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | DTO normalization, cache isolation, absent versus zero | Vitest service tests with PascalCase/camelCase fixtures. |
| Component | Selector identity, loading/empty/error/403 states, no mixed rows, responsive labels | React Testing Library tests for table and mobile components. |
| Regression | `product.stock` and featured/ecommerce behavior remain central-only | Extend existing availability and inventory characterization tests. |
| Build | Router and production bundle remain valid | `npm run test` and `npm run build`. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed; the existing TanStack Router route remains intact.

## Migration / Rollout

No frontend data migration. Gate implementation on the backend location directory/read contract in `development`. Rollback by reverting the frontend change and restoring the central-only adapter/view; no persisted data needs deletion.

## Open Questions

- [ ] Confirm the backend read endpoint path and exact unauthorized response before implementation.
- [ ] Confirm whether the backend returns absent product/location rows or a complete zero-filled matrix.
- [ ] Confirm whether any role may view only one POS; the frontend must not infer this from role names.
