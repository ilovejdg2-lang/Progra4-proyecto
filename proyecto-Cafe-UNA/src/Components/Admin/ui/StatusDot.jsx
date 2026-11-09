const TONES = {
  success: "bg-[var(--admin-status-success-text)]",
  neutral: "bg-[var(--admin-border-input)]",
  warning: "bg-[var(--admin-status-warning-text)]",
};

/** Decorative status dot. The status is always also present as text or in the accessible name. */
export function StatusDot({ tone = "neutral", className = "" }) {
  return <span aria-hidden="true" className={`inline-block size-2 shrink-0 rounded-full ${TONES[tone] || TONES.neutral} ${className}`} />;
}
