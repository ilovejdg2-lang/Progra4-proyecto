import { useEffect } from "react";

let scrollLockCount = 0;
let savedOverflow = "";

let adminModalCount = 0;
let savedHtmlOverflow = "";

function getRoot() {
  return document.getElementById("root");
}

function acquireBodyScrollLock() {
  if (scrollLockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function releaseBodyScrollLock() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = savedOverflow;
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
    savedHtmlOverflow = document.documentElement.style.overflow;
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
    document.documentElement.style.overflow = savedHtmlOverflow;
    const root = getRoot();
    if (root) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
  }
}

export function useAdminModalLock(locked) {
  useBodyScrollLock(locked);

  useEffect(() => {
    if (!locked) {
      return undefined;
    }

    acquireAdminModalLock();
    return () => releaseAdminModalLock();
  }, [locked]);
}
