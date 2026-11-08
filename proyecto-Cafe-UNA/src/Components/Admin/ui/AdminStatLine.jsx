/**
 * Compact stat caption: sentence-case muted label next to a semibold tabular value.
 * `items`: [{ label, value }]. Replaces boxed uppercase stat tiles.
 */
export function AdminStatLine({ items, className = "" }) {
  if (!items?.length) return null;
  return (
    <dl className={`m-0 flex flex-wrap gap-x-6 gap-y-1 ${className}`.trim()}>
      {items.map((item, index) => (
        <div key={index} className="flex min-w-0 items-baseline gap-1.5">
          <dt className="text-[13px] text-[var(--admin-text-muted)]">{item.label}</dt>
          <dd className="m-0 text-[length:var(--text-body)] font-semibold tabular-nums text-[var(--admin-text-primary)]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
