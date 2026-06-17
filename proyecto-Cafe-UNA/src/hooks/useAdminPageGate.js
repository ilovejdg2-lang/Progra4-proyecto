import { usePublicPageLoadingGate } from './usePublicPageLoadingGate';
import { getLoadingMessageForPathname } from '../lib/pageLoadingMessages';

export function useAdminPageGate(pathname, isReady) {
  const showLoading = usePublicPageLoadingGate(pathname, isReady);

  return {
    showLoading,
    loadingMessage: getLoadingMessageForPathname(pathname),
  };
}

/** @deprecated Usar useAdminPageGate */
export function useAdminPageLoadingGate(pathname, isReady) {
  return usePublicPageLoadingGate(pathname, isReady);
}
