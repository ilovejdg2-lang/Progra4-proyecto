# Proposal: Inventory Location Stock Foundation

## Intent

Establish a frontend foundation for viewing product stock by location without mixing catalog data, POS stock, or ecommerce availability. Preserve current Bodega Central compatibility while preparing future transfers.

## Scope

### In Scope
- Define and normalize four locations: `BODEGA_CENTRAL` (Bodega Central), `POS_FUNA_UNA` (FUNA-UNA), `POS_EDITORIAL` (Editorial), and `POS_STAND_FERIAS` (Stand Ferias).
- Add a location directory and scoped stock listing with explicit selected-location context.
- Keep catalog payloads independent and ecommerce availability based only on Bodega Central stock.
- Preserve backend `Producto.Stock` as a temporary Bodega Central mirror.

### Out of Scope
- Transfers, sales, movements, production assets, or POS workflows.
- Direct POS stock editing; transfers will change POS quantities later.
- Changing checkout rules, catalog forms, or the existing central-stock editor behavior.

## Capabilities

### New Capabilities
- `location-stock-foundation`: Location directory, normalized product-location records, scoped reads, and non-mixed presentation.

### Modified Capabilities
- None. Existing catalog and ecommerce requirements remain unchanged.

## Approach

Use a location-scoped view in the existing inventory surface. Introduce `Location` and `LocationStock` DTOs, normalize responses at the service boundary, and key state by `locationCode` and `productId`. The UI must distinguish absent stock from zero. Backend must provide canonical codes, labels, read contracts, authorization, and the temporary central mirror first.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/productosService.js` | Modified | Location directory and location-scoped stock adapter. |
| `src/hooks/` and inventory components | Modified | Selected-location state and non-mixed rendering. |
| `src/lib/productoDisponibilidad.js` and ecommerce pages | Preserved | Continue using Bodega Central only. |
| Backend API contract | Dependency | Canonical locations, product-location reads, and authorization. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing rows are mistaken for zero | Med | Preserve an explicit unknown/absent state. |
| POS stock changes ecommerce availability | High | Never write POS values into `product.stock`. |
| Frontend contract diverges from backend | Med | Approve DTOs and authorization behavior before implementation. |

## Rollback Plan

Revert the frontend change and restore the prior central-only adapter/view. Backend `Producto.Stock` remains the compatibility source, so rollback does not require data deletion or migration reversal.

## Dependencies

- Backend location directory, read contract, and authorization must be available in development first.

## Success Criteria

- [ ] Four canonical locations are represented without positional or display-name inference.
- [ ] Selecting one location never renders another location's quantity.
- [ ] Catalog and ecommerce availability remain based exclusively on Bodega Central stock.
- [ ] Loading, empty, absent, unauthorized, and error states are accessible.
- [ ] `npm --prefix proyecto-Cafe-UNA run build` passes without new baseline regressions.
