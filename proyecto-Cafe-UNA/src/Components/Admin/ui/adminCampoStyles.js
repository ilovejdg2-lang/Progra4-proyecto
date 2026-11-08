function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const focusRing =
  "focus-visible:border-[var(--admin-focus-ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]";

export const adminCampoInputCls = cn(
  "h-[var(--control-height)] w-full min-w-0 rounded-full border border-[var(--admin-border-input)] bg-[var(--admin-surface)] px-4",
  "text-[length:var(--text-body)] font-normal text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)]",
  "outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  focusRing,
);

export const adminCampoAreaCls = cn(
  "min-h-[var(--control-height)] w-full min-w-0 resize-y rounded-2xl border border-[var(--admin-border-input)] bg-[var(--admin-surface)] px-4 py-3",
  "text-[length:var(--text-body)] font-normal leading-6 text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)]",
  "outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  focusRing,
);
