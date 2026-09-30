/**
 * Sidebar behaviour: the mobile Menu button, and scroll-spy for the current
 * step's section links. Loaded as a module, so it runs after the document
 * is parsed and every heading already exists.
 */

// ---- Mobile menu ----------------------------------------------------------
// Below 860px the panel is hidden until opened (CSS: .js .sidebar-panel).
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const panel = toggle ? document.getElementById(toggle.getAttribute('aria-controls') ?? '') : null;

if (toggle && panel) {
  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  // Jumping to a section on this page: close the menu so the section is visible.
  panel.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a[data-nav-anchor]')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}

// ---- Scroll-spy (ported from the book) ------------------------------------
// Highlights the section you're reading, keeps it visible in the sidebar,
// and mirrors it in the URL hash so copying the link or refreshing lands
// on the same section.
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-anchor]'));
const bySlug = new Map(links.map((a) => [a.dataset.navAnchor!, a]));
const targets = links
  .map((a) => document.getElementById(a.dataset.navAnchor!))
  .filter((el): el is HTMLElement => el !== null);

if (targets.length > 0) {
  // On mobile the sidebar is part of the page flow, so scrolling a link
  // into view would yank the whole page back up. Desktop only.
  const sidebarScrolls = window.matchMedia('(min-width: 861px)');
  const LINE = 120; // px from the top of the viewport that counts as "reading"
  let active: HTMLAnchorElement | undefined;

  const setActive = (link: HTMLAnchorElement | undefined) => {
    if (link === active) return;
    active?.removeAttribute('aria-current');
    active = link;
    if (!link) return;
    link.setAttribute('aria-current', 'true');
    if (sidebarScrolls.matches) link.scrollIntoView({ block: 'nearest' });
  };

  // Update the hash without adding history entries or scrolling. At the
  // very top, drop it so a fresh landing keeps a clean URL.
  const setHash = (id: string | null) => {
    const url = new URL(window.location.href);
    const next = id ? `#${id}` : '';
    if (url.hash === next) return;
    url.hash = next;
    history.replaceState(history.state, '', id ? url.href : url.href.replace(/#$/, ''));
  };

  const update = () => {
    let current: HTMLElement | null = null;
    for (const heading of targets) {
      if (heading.getBoundingClientRect().top <= LINE) current = heading;
      else break;
    }
    // Highlight the first section by default, but only put it in the URL
    // once the reader has actually reached it.
    setActive(bySlug.get((current ?? targets[0]).id));
    setHash(current ? current.id : null);
  };

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    },
    { passive: true },
  );
  update();
}
