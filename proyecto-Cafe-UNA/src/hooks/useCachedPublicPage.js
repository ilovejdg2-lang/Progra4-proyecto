import { useCallback } from 'react';
import { useCachedPageData } from './useCachedPageData';
import { usePublicPageLoadingGate } from './usePublicPageLoadingGate';
import { getLoadingMessageForCacheKey } from '../lib/pageLoadingMessages';

export function useCachedPublicPage(cacheKey, fetcher) {
  const load = useCallback(() => fetcher(), [fetcher]);
  const { data, status, error, reload } = useCachedPageData(cacheKey, load);
  const showLoading = usePublicPageLoadingGate(cacheKey, status === 'ready');

  return {
    data,
    status,
    error,
    reload,
    showLoading,
    isError: status === 'error',
    isReady: status === 'ready',
    loadingMessage: getLoadingMessageForCacheKey(cacheKey),
  };
}
