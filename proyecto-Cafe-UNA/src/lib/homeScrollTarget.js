const STORAGE_KEY = 'homeScrollTarget';

let pendingTarget = null;

export function setHomeScrollTarget(sectionId) {
  if (!sectionId) {
    pendingTarget = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }

  pendingTarget = sectionId;
  try {
    sessionStorage.setItem(STORAGE_KEY, sectionId);
  } catch {
    // ignore
  }
}

export function peekHomeScrollTarget() {
  if (pendingTarget) return pendingTarget;

  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearHomeScrollTarget() {
  pendingTarget = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function scrollToHomeSection(sectionId) {
  if (!sectionId) return false;

  const element = document.getElementById(sectionId);
  if (!element) return false;

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

export function runHomeScrollWhenReady(isReady, onDone) {
  if (!isReady) return undefined;

  const target = peekHomeScrollTarget();
  if (!target) return undefined;

  let cancelled = false;
  let attempts = 0;

  const attemptScroll = () => {
    if (cancelled) return;

    if (scrollToHomeSection(target)) {
      clearHomeScrollTarget();
      onDone?.();
      return;
    }

    attempts += 1;
    if (attempts < 50) {
      requestAnimationFrame(attemptScroll);
    } else {
      clearHomeScrollTarget();
    }
  };

  const timeoutId = window.setTimeout(() => {
    requestAnimationFrame(attemptScroll);
  }, 120);

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
  };
}
