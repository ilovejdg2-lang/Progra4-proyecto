import { Link, useRouterState } from "@tanstack/react-router";

import { ST } from "../T/ST";
import { getAdminBreadcrumbItems } from "./adminBreadcrumbItems";
import "./AdminBreadcrumb.css";

export function AdminBreadcrumb() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({ select: (state) => state.location.search });
  const items = getAdminBreadcrumbItems(pathname, search);

  if (!items.length) return null;

  return (
    <nav className="admin-breadcrumb" aria-label="breadcrumb">
      <ol className="admin-breadcrumb__list">
        {items.map((item, index) => {
          const esUltimo = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="admin-breadcrumb__item">
              {index > 0 ? (
                <span className="admin-breadcrumb__sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              {esUltimo ? (
                <strong className="admin-breadcrumb__current" aria-current="page">
                  <ST>{item.label}</ST>
                  {item.detail ? ` (${item.detail})` : null}
                </strong>
              ) : item.to ? (
                <Link
                  to={item.to}
                  {...(item.search ? { search: item.search } : {})}
                  className="admin-breadcrumb__link"
                >
                  <ST>{item.label}</ST>
                </Link>
              ) : (
                <span className="admin-breadcrumb__text">
                  <ST>{item.label}</ST>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
