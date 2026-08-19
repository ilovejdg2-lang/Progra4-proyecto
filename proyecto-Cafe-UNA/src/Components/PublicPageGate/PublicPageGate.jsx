import PageLoading from '../PageLoading/PageLoading';
import { contactSupportMessage, sanitizeUserFacingError } from '../../lib/formLimits';

export function PublicPageGate({
  showLoading,
  loadingMessage = 'Cargando p\u00e1gina...',
  isError = false,
  error,
  errorMessage,
  errorFallback,
  onRetry,
  children,
}) {
  if (showLoading) {
    return <PageLoading message={loadingMessage} />;
  }

  if (isError) {
    if (errorFallback) return errorFallback;

    return (
      <PageLoading
        isError
        message={sanitizeUserFacingError(error) || errorMessage || 'No se pudo cargar la p\u00e1gina.'}
        detail={contactSupportMessage()}
        onRetry={onRetry}
      />
    );
  }

  return children;
}
