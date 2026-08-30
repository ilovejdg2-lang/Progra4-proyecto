import { usePublicPageLoadingGate } from './usePublicPageLoadingGate';
import { getLoadingMessageForPathname } from '../lib/pageLoadingMessages';
import { getRouteCacheKey } from '../lib/pageSessionState';

export function useAdminPageGate(pathname, isReady) {
  const cacheKey = getRouteCacheKey(pathname) || pathname;
  const showLoading = usePublicPageLoadingGate(cacheKey, isReady);

  return {
    showLoading,
    loadingMessage: getLoadingMessageForPathname(pathname),
  };
}
