import { useId } from "react";

/**
 * Header shared by redesigned public pages: serif title, one muted line and an
 * optional actions slot, closed by a 1px divider. Styles live in styles/publicSystem.css.
 */
export function PublicPageHeader({ title, lead, actions = null, titleId }) {
  const generatedId = useId();
  const id = titleId || generatedId;
  return (
    <header className="pub-page-header">
      <div className="pub-page-header__text">
        <h1 id={id} className="pub-serif-title pub-page-header__title">
          {title}
        </h1>
        {lead ? <p className="pub-page-header__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="pub-page-header__actions">{actions}</div> : null}
    </header>
  );
}
