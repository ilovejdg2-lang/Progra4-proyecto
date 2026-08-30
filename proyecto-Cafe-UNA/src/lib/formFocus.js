function cssEscape(value) {
  const text = String(value ?? "");
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(text);
  }
  return text.replace(/"/g, '\\"');
}

function resolveRoot(root) {
  if (!root) return document;
  if (typeof root === "object" && "current" in root) {
    return root.current || document;
  }
  return root;
}

function queryIn(root, selector) {
  try {
    return root.querySelector?.(selector) ?? null;
  } catch {
    return null;
  }
}

function isVisible(el) {
  if (!el || !(el instanceof Element)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  // jsdom no calcula layout; si no hay rects, igual consideramos visible
  const rects = el.getClientRects?.() ?? [];
  if (rects.length > 0) return true;
  return typeof window.HTMLElement !== "undefined";
}

function scrollAndFocus(el, { focus = true } = {}) {
  if (!el) return;
  try {
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  } catch {
    try {
      el.scrollIntoView(true);
    } catch {
      /* ignore */
    }
  }

  if (!focus || typeof el.focus !== "function") return;

  window.requestAnimationFrame(() => {
    try {
      if (el.matches?.("input, select, textarea, button, [tabindex], a[href]")) {
        el.focus({ preventScroll: true });
        return;
      }
      if (!el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "-1");
      }
      el.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  });
}

const DEFAULT_BANNERS = [
  '[role="alert"]',
  ".mensaje-error",
  ".login-error-banner",
  ".login-field-error",
  ".form-error",
  "[data-form-error]",
];

/**
 * Lleva el foco/scroll al primer error de un formulario.
 * @param {{
 *   errors?: Record<string, unknown>,
 *   root?: Element | Document | { current?: Element | null },
 *   fieldMap?: Record<string, string>,
 *   fieldOrder?: string[],
 *   bannerSelectors?: string[],
 * }} [options]
 */
export function focusFormError({
  errors,
  root,
  fieldMap = {},
  fieldOrder,
  bannerSelectors = DEFAULT_BANNERS,
} = {}) {
  const scope = resolveRoot(root);

  if (errors && typeof errors === "object") {
    const keys = Array.isArray(fieldOrder) && fieldOrder.length > 0
      ? fieldOrder.filter((key) => Boolean(errors[key]))
      : Object.keys(errors).filter((key) => Boolean(errors[key]));

    for (const key of keys) {
      const name = fieldMap[key] || key;
      const escaped = cssEscape(name);
      const el =
        queryIn(scope, `[name="${escaped}"]`) ||
        queryIn(scope, `#${escaped}`) ||
        queryIn(scope, `[data-error-field="${escaped}"]`) ||
        queryIn(document, `[name="${escaped}"]`) ||
        queryIn(document, `#${escaped}`);

      if (el && isVisible(el)) {
        scrollAndFocus(el);
        return true;
      }
    }
  }

  const invalid =
    queryIn(scope, '[aria-invalid="true"]') ||
    queryIn(document, '[aria-invalid="true"]');
  if (invalid && isVisible(invalid)) {
    scrollAndFocus(invalid);
    return true;
  }

  for (const selector of bannerSelectors) {
    const nodes = [
      ...(scope.querySelectorAll?.(selector) ?? []),
    ];
    for (const banner of nodes) {
      if (!banner.textContent?.trim()) continue;
      if (!isVisible(banner)) continue;
      scrollAndFocus(banner, { focus: true });
      return true;
    }
  }

  return false;
}

/** Espera a que React pinte el mensaje de error y luego enfoca. */
export function queueFocusFormError(options) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      focusFormError(options);
    });
  });
}

/** Listener global para validación nativa HTML5 (`required`, `type=email`, etc.). */
export function installNativeInvalidFocus() {
  if (typeof document === "undefined") return () => {};
  if (document.documentElement.dataset.formInvalidFocus === "1") {
    return () => {};
  }
  document.documentElement.dataset.formInvalidFocus = "1";

  const onInvalid = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    scrollAndFocus(target);
  };

  document.addEventListener("invalid", onInvalid, true);
  return () => {
    document.removeEventListener("invalid", onInvalid, true);
    delete document.documentElement.dataset.formInvalidFocus;
  };
}
