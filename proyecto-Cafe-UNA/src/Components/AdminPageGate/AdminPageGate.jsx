import AdminRouteLoading from '../Admin/AdminRouteLoading';
import { Navigate } from '@tanstack/react-router';

export function AdminPageGate({
  showLoading,
  message,
  loadingMessage,
  allowed = true,
  children,
}) {
  if (showLoading) {
    return <AdminRouteLoading message={message || loadingMessage} />;
  }

  if (allowed === false) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
