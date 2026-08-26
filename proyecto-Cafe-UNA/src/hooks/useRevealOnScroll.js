import { useEffect } from 'react';

export function useRevealOnScroll(enabled, rootSelector = '.home-page') {
  useEffect(() => {
    if (!enabled) return undefined;

    const root = typeof rootSelector === 'string'
      ? document.querySelector(rootSelector)
      : rootSelector;
    if (!root) return undefined;

    const nodes = Array.from(root.querySelectorAll('.reveal-on-scroll'));
    if (nodes.length === 0) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [enabled, rootSelector]);
}
