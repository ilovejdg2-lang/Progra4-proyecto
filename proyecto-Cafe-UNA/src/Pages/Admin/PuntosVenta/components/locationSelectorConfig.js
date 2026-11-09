/** Up to this many locations the selector is a segmented pill control; above it, a searchable combobox. */
export const LOCATION_PILLS_MAX = 6;

/** Location codes come from the API; keep DOM ids to a safe character set. */
export const safeIdPart = (value) => String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "_");

export const locationTabId = (baseId, code) => `${baseId}-tab-${safeIdPart(code)}`;
