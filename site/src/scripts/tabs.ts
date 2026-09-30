/**
 * Turns <Tabs> panels into WAI-ARIA tabs: a tablist of buttons, one panel
 * visible at a time, Left/Right/Home/End to move (with automatic
 * activation). Without this script every panel stays visible.
 */
import { nextTabIndex } from '../lib/tabs';

let counter = 0;

function enhance(root: HTMLElement): void {
  const panels = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-tab-panel]'));
  if (panels.length < 2) return;

  const base = `tabs-${++counter}`;
  const list = document.createElement('div');
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', root.dataset.tabsLabel ?? '');

  const tabs = panels.map((panel, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${base}-tab-${i + 1}`;
    tab.setAttribute('role', 'tab');
    tab.textContent = panel.dataset.tabLabel ?? `Tab ${i + 1}`;
    panel.id ||= `${base}-panel-${i + 1}`;
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    list.append(tab);
    return tab;
  });

  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  };

  list.addEventListener('click', (event) => {
    const tab = (event.target as Element).closest<HTMLButtonElement>('[role="tab"]');
    if (tab) select(tabs.indexOf(tab), false);
  });
  list.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    const next = nextTabIndex(event.key, current, tabs.length);
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  });

  root.prepend(list);
  root.classList.add('is-enhanced');
  select(0, false);
}

document.querySelectorAll<HTMLElement>('[data-tabs]:not(.is-enhanced)').forEach(enhance);
