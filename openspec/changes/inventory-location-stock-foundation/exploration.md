## Exploration: Inventory Location Stock Foundation

### Current State

The frontend currently has one administrative inventory route, `/admin/producto`, registered in `proyecto-Cafe-UNA/src/router.jsx` and exposed from the inventory section of `proyecto-Cafe-UNA/src/Components/Admin/AppSidebar.jsx`. The page is catalog-oriented and now composes two independent remote states: `useProductCatalog` for product data and `useCentralStock` for a single stock scope identified as `BODEGA_CENTRAL`.

The current stock model is central-only:

- `proyecto-Cafe-UNA/src/services/productosService.js` normalizes stock into `{ productId, locationCode, stock, confidence }`, but `normalizarStockCentral` hardcodes `locationCode: "BODEGA_CENTRAL"` and `obtenerStockCentral` reads the same product response for every record.
- `proyecto-Cafe-UNA/src/hooks/useCentralStock.js` exposes one list and one retryable request state; it has no location parameter or location directory.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx` joins catalog rows to that central-stock list by product ID and renders one stock value per product.
- `CentralStockEditor.jsx`, `ProductCatalogTable.jsx`, and `ProductCatalogMobileList.jsx` explicitly label and edit only Bodega Central stock.
- `productoDisponibilidad.js`, `Products.jsx`, `productsPageData.js`, and `cartStorage.js` use the normalized `product.stock` value for ecommerce availability. That value currently represents central stock and must remain central-only until a separate sales-point consumption rule is approved.
- Existing tests cover the central-only contract, independent catalog/stock loading, authorization, unknown stock, and the central stock endpoint. There are no frontend tests or models for a location directory, multiple location records, location selection, or per-location authorization.

The frontend contains no dedicated location route, location service, location constants, or point-of-sale stock screen. Existing permissions include `actualizar_stock_productos` for staff and `ver_inventario` for administrators, but they do not express access by location. Product catalog payloads already exclude stock and location fields, which is the correct separation to preserve.

This exploration is frontend-only. A stable backend contract is required before implementation: canonical location codes and labels, the read shape for multiple product-location records, the update scope, authorization behavior, and whether the server returns zero, unknown, or absent rows for a product/location pair.

### Affected Areas

- `proyecto-Cafe-UNA/src/services/productosService.js` — replace the central-only stock adapter with a location-aware boundary without leaking PascalCase or raw API shapes to components; preserve the catalog payload exclusion.
- `proyecto-Cafe-UNA/src/hooks/useCentralStock.js` — likely evolve into a location-scoped stock hook or be complemented by a new hook that can load a selected location independently.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.jsx` — currently merges one stock record per product and would need explicit location context rather than silently showing one aggregate value.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/CentralStockEditor.jsx` — currently hardcodes Bodega Central; the future editor must receive a location record and clearly identify the selected location.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductCatalogTable.jsx` — currently has one `Stock` column; it must not show central and point-of-sale quantities as one mixed number.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductCatalogMobileList.jsx` — same single-location presentation constraint for small screens.
- `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/components/ProductActions.jsx` — stock action visibility and accessible labels may need to communicate the selected location.
- `proyecto-Cafe-UNA/src/lib/productoDisponibilidad.js` — must continue using known Bodega Central stock for current ecommerce eligibility; it should not accidentally use a selected sales-point record.
- `proyecto-Cafe-UNA/src/Pages/Products/Products.jsx`, `proyecto-Cafe-UNA/src/lib/productsPageData.js`, and `proyecto-Cafe-UNA/src/lib/cartStorage.js` — current public purchase behavior depends on central stock and is out of scope for sales-point stock in this foundation slice.
- `proyecto-Cafe-UNA/src/router.jsx` and `proyecto-Cafe-UNA/src/Components/Admin/AppSidebar.jsx` — affected only if the approved UX introduces a dedicated stock-by-location route; the existing product route is the lower-risk integration point.
- `proyecto-Cafe-UNA/src/lib/permisos.js` — existing permissions are role-wide, so any location-specific access requirement needs an explicit contract and must not be inferred in the UI.
- `proyecto-Cafe-UNA/src/services/productosService.test.js`, `proyecto-Cafe-UNA/src/hooks/useCentralStock.test.js`, and `proyecto-Cafe-UNA/src/Pages/Admin/InventarioProducto/InventarioProducto.characterization.test.jsx` — extend coverage for location identity, isolation, loading/error/empty states, and non-mixed rendering.

### Approaches

1. **Location-scoped inventory view inside `/admin/producto`** — keep the existing catalog route, add a clearly labeled location selector or tabs for Bodega Central and the three points of sale, and load/edit stock only for the selected location through a separate location-aware state boundary.
   - Pros: Reuses the current inventory page, modal primitives, table/mobile views, permissions, and characterization tests; makes the selected scope explicit; avoids mixing product catalog data with location stock.
   - Cons: Requires careful handling of selected-location state, refreshes, unknown rows, and permissions; the page gains a second operational dimension.
   - Effort: Medium

2. **Dedicated `/admin/inventario/stock` route** — leave `/admin/producto` as catalog-only and build a separate stock-by-location screen with its own route, sidebar entry, service, hook, table, and editor.
   - Pros: Strongest separation between catalog and stock; supports future transfers and movements without overloading the catalog page.
   - Cons: Adds navigation and duplicate product lookup/presentation work; requires a larger first slice and a new route-level permission contract; risks becoming a second inventory surface before the location API is proven.
   - Effort: High

3. **Client-side aggregation of all locations from the existing product response** — fabricate a four-location view by copying the current central stock value or assigning defaults until the backend supports location records.
   - Pros: Fast visual prototype.
   - Cons: Produces false inventory data, cannot guarantee isolation, hides missing records as zero, and creates a contract that will need to be discarded; unsafe for operational stock.
   - Effort: Low initially, High rework

### Recommendation

Use **Approach 1, with a contract-first location-scoped view**, and treat F06 as a foundation rather than as transfers, movements, sales, or assets.

First approve a frontend DTO boundary such as `Location = { code, name, kind, active }` and `LocationStock = { productId, locationCode, stock, confidence }`. The frontend should keep catalog records separate from a map keyed by `locationCode` and then by `productId`; a selected location must be explicit in the UI and request state. Bodega Central and the three points of sale should be represented by canonical server-provided codes, not by positional array indexes or hardcoded display names.

The first implementation slice should establish location constants/normalization, a location directory read model, a location-scoped query state, and tests proving that records from one location never populate another. It may expose a read-only location selector if the backend read contract is available. Stock editing for locations should be a subsequent focused slice unless the backend update contract and authorization are already approved. The current ecommerce rule remains Bodega Central-only, and the catalog form must continue excluding all stock/location fields.

Do not add a sales-point stock aggregate to `producto.stock`, do not merge all four quantities into one table cell, and do not change checkout behavior in F06. Assets, transfers, movements, sales registration, and point-of-sale workflows remain out of scope.

### Risks

- No frontend location directory or multi-location contract exists today; implementation without backend agreement would be speculative.
- Reusing `product.stock` for a selected point of sale could silently alter ecommerce availability and checkout behavior.
- The canonical codes and labels for the three points of sale are not present in the frontend and must be supplied by the product/backend contract.
- A missing stock row must be distinguishable from confirmed zero; defaulting an absent location record to zero would create false inventory.
- Existing role-wide permissions do not define whether a seller may view or edit only one point of sale; the UI must not invent that authorization rule.
- The current product service caches raw product responses and central-normalized responses; adding location data without an explicit cache key could show one location's values under another location.
- A dedicated route would increase scope and review size; a selector embedded in the current page is smaller but needs strong visual separation and accessible context.
- The existing test/lint baseline must be preserved; location isolation, selected-location loading, retry, empty, unauthorized, and responsive states need focused coverage.

### Ready for Proposal

**Partially.** The frontend architecture supports a location-scoped foundation, but proposal/specification should first record: the four canonical location codes and labels, the backend read/update response shapes, the behavior for absent versus zero stock, the role/location authorization model, and whether F06 includes editing or only the read/selection foundation. Once those decisions are supplied, the recommended first branch is a small frontend contract/state slice; no implementation should begin from the current central-only endpoint alone.
