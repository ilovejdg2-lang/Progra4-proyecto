import AdminRouteLoading from '../Admin/AdminRouteLoading';

export function AdminPageGate({ showLoading, message, children }) {
  if (showLoading) {
    return <AdminRouteLoading message={message} />;
  }

  return children;
}
