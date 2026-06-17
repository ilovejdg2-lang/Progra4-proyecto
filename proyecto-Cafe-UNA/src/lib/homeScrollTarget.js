import { normalizePathname } from './paths';

const STORAGE_KEY = 'homeScrollTarget';

let pendingTarget = null;

export const HOME_SCROLL_SECTIONS = {
  hero: 'hero',
  about: 'sobre-nosotros',
  products: 'productos',
  voluntariado: 'iniciativas',
};

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

export function navigateToHomeSection(navigate, sectionId) {
  if (sectionId) {
    setHomeScrollTarget(sectionId);
  } else {
    clearHomeScrollTarget();
  }

  navigate({ to: '/' });
}

export function scrollToHomeSection(sectionId) {
  if (!sectionId) return false;

  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  if (sectionId === HOME_SCROLL_SECTIONS.hero) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }

  return false;
}

export function goToHomeHero(navigate, pathname = window.location.pathname) {
  clearHomeScrollTarget();

  if (normalizePathname(pathname) === '/') {
    scrollToHomeSection(HOME_SCROLL_SECTIONS.hero);
    return;
  }

  setHomeScrollTarget(HOME_SCROLL_SECTIONS.hero);
  navigate({ to: '/' });
}

export function runHomeScrollWhenReady(isReady) {
  if (!isReady) return undefined;

  const target = peekHomeScrollTarget();
  if (!target) return undefined;

  let cancelled = false;
  let attempts = 0;

  const attemptScroll = () => {
    if (cancelled) return;

    if (scrollToHomeSection(target)) {
      clearHomeScrollTarget();
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
