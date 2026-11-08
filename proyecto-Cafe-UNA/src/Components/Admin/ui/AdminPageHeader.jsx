/**
 * Shared title block for admin inventory screens: one h1, an optional one-line
 * description, an optional stat caption (`meta`) and an actions slot on the right
 * (wraps below the title on mobile). The h1 size comes from the admin scope rule
 * in index.css, so it is not set here.
 */
export function AdminPageHeader({ title, description, meta, actions }) {
  return (
    <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {/* Important utilities: unlayered global h1/p rules in index.css (color, margin) beat Tailwind layers. */}
        <h1 className="break-words text-[var(--admin-text-primary)]!">{title}</h1>
        {description ? (
          <p className="mt-1! text-[length:var(--text-body)] text-[var(--admin-text-muted)]">{description}</p>
        ) : null}
        {meta ? <div className="mt-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div data-slot="actions" className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
