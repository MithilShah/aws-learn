/**
 * Loads Pagefind's prebuilt search UI into [data-pagefind-ui]. Paths come
 * from data attributes rendered with withBase(), so nothing here assumes
 * the site lives at /aws/.
 */

type PagefindUIConstructor = new (options: Record<string, unknown>) => unknown;

declare global {
  interface Window {
    PagefindUI?: PagefindUIConstructor;
  }
}

const host = document.querySelector<HTMLElement>('[data-pagefind-ui]');

if (host?.id && host.dataset.bundle) {
  const script = document.createElement('script');
  script.src = `${host.dataset.bundle}pagefind-ui.js`;
  script.onload = () => {
    if (!window.PagefindUI) return;
    new window.PagefindUI({
      element: `#${host.id}`,
      bundlePath: host.dataset.bundle,
      // Result URLs are relative to dist/ ('/config/…'). Pagefind 1.5 infers
      // '/aws/' from the bundle path; set it explicitly so results can't
      // silently point at the WordPress root if that inference changes.
      baseUrl: host.dataset.baseUrl,
      showSubResults: true,
      showImages: false,
      resetStyles: false,
      translations: { placeholder: 'Search the journeys' },
    });
  };
  script.onerror = () => {
    host.textContent = 'Search is unavailable right now.';
  };
  document.head.append(script);
}

export {};
