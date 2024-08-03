import { useState, useEffect, useCallback } from 'react';

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const handleVisibilityChange = useCallback((): void => {
    setIsVisible(!document.hidden);
  }, []);

  const handlePageHide = useCallback((): void => {
    setIsVisible(false);
  }, []);

  const handlePageShow = useCallback((): void => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') {
      return;
    }

    let timeoutId: number | undefined;

    const handleBlur = (): void => {
      timeoutId = window.setTimeout(() => setIsVisible(false), 100);
    };

    const handleFocus = (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsVisible(true);
    };

    // Standard Page Visibility API
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // For iOS Safari
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    // For general mobile behavior
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleVisibilityChange, handlePageHide, handlePageShow]);

  return isVisible;
}
