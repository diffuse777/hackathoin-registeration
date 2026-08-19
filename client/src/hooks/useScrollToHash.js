import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useScrollToHash() {
  const { hash, pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const reduceMotion = prefersReducedMotion();

    if (hash) {
      const id = decodeURIComponent(hash.replace('#', ''));
      const target = document.getElementById(id);

      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    } else if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    previousPath.current = pathname;
  }, [hash, pathname]);
}
