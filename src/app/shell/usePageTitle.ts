import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { appName, homeTitle } from '../paths';

/**
 * Sets the document title and, after client-side navigation, moves focus to the page's h1
 * so keyboard and screen-reader users start at the new content. A URL fragment moves focus
 * to the matching section instead. The first page load and query changes (filters,
 * playground component) leave focus alone.
 */
export function usePageTitle(title: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    document.title = title === appName ? homeTitle : `${title} · ${appName}`;
  }, [title]);

  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.scrollIntoView();
      target.focus({ preventScroll: true });
      return;
    }
    // BrowserRouter gives the initial entry the key "default"; every navigation gets a new key.
    if (key === 'default') return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    headingRef.current?.focus({ preventScroll: true });
    // Only a new pathname or fragment counts as a new destination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash]);

  return headingRef;
}
