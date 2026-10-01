/**
 * Makes <KeyPrefixExplorer> interactive: a two-button toggle switches between
 * the flat key list (how S3 stores objects) and the derived folder tree (how
 * the console shows them). Without this script both panes are shown, each
 * under its own heading, so the content is complete.
 *
 * This is a pure view toggle — the tree itself is rendered on the server from
 * lib/key-prefix, so there is no layout logic to duplicate here.
 */
type View = 'flat' | 'tree';

function enhance(root: HTMLElement): void {
  const toggle = root.querySelector<HTMLElement>('[data-kpe-toggle]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-kpe-view]'));
  const panes = Array.from(root.querySelectorAll<HTMLElement>('[data-kpe-pane]'));
  if (!toggle || tabs.length === 0 || panes.length === 0) return;

  const show = (view: View) => {
    for (const tab of tabs) tab.setAttribute('aria-pressed', String(tab.dataset.kpeView === view));
    for (const pane of panes) pane.hidden = pane.dataset.kpePane !== view;
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => show(tab.dataset.kpeView as View));
  }

  root.classList.add('is-enhanced');
  toggle.hidden = false;
  show('flat');
}

document.querySelectorAll<HTMLElement>('[data-kpe]:not(.is-enhanced)').forEach(enhance);

// This file has no imports; mark it a module so its top-level names stay local.
export {};
