import { useEffect } from "react";

let scrollLockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyWidth = "";
let savedScrollY = 0;

let adminModalCount = 0;
let savedHtmlOverflowModal = "";

function getRoot() {
  return document.getElementById("root");
}

function clearBodyFixedLockStyles() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.documentElement.classList.remove("scroll-locked");
}

function acquireBodyScrollLock() {
  if (scrollLockCount === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    savedBodyOverflow = document.body.style.overflow;
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyPosition = document.body.style.position;
    savedBodyTop = document.body.style.top;
    savedBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = "100%";
    document.documentElement.classList.add("scroll-locked");
  }
  scrollLockCount += 1;
}

function releaseBodyScrollLock() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.documentElement.style.overflow = savedHtmlOverflow;
    document.body.style.overflow = savedBodyOverflow;
    document.body.style.position = savedBodyPosition;
    document.body.style.top = savedBodyTop;
    document.body.style.width = savedBodyWidth;
    document.documentElement.classList.remove("scroll-locked");
    window.scrollTo(0, savedScrollY);
  }
}

export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) {
      return undefined;
    }

    acquireBodyScrollLock();
    return () => releaseBodyScrollLock();
  }, [locked]);
}

function acquireAdminModalLock() {
  if (adminModalCount === 0) {
    savedHtmlOverflowModal = document.documentElement.style.overflow;
    document.documentElement.classList.add("admin-modal-open");
    document.documentElement.style.overflow = "hidden";
    const root = getRoot();
    if (root) {
      root.setAttribute("inert", "");
      root.setAttribute("aria-hidden", "true");
    }
  }
  adminModalCount += 1;
}

function releaseAdminModalLock() {
  adminModalCount = Math.max(0, adminModalCount - 1);
  if (adminModalCount === 0) {
    document.documentElement.classList.remove("admin-modal-open");
    document.documentElement.style.overflow = savedHtmlOverflowModal;
    const root = getRoot();
    if (root) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
  }
}

/** Solo overflow; sin position:fixed para no dejar el scroll del admin trabado. */
export function useAdminModalLock(locked) {
  useEffect(() => {
    if (!locked) {
      return undefined;
    }

    acquireAdminModalLock();
    return () => releaseAdminModalLock();
  }, [locked]);
}

/** Limpia bloqueos residuales (p. ej. tras cerrar un modal o el menú móvil). */
export function forceUnlockAdminScroll() {
  scrollLockCount = 0;
  adminModalCount = 0;
  clearBodyFixedLockStyles();
  document.documentElement.classList.remove("admin-modal-open");
  document.documentElement.style.overflow = "";
  const root = getRoot();
  if (root) {
    root.removeAttribute("inert");
    root.removeAttribute("aria-hidden");
  }
}
