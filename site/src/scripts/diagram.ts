/**
 * A <Diagram> frame that is narrower than the diagram scrolls sideways.
 * Only then does it become a focusable, labelled region, so keyboard users
 * can scroll it without adding an empty tab stop on wide screens.
 */
function update(frame: HTMLElement): void {
  const scrolls = frame.scrollWidth > frame.clientWidth + 1;
  frame.toggleAttribute('data-scrolls', scrolls);
  if (scrolls) {
    frame.tabIndex = 0;
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-label', `${frame.dataset.label ?? 'Diagram'} (scrolls sideways)`);
  } else {
    frame.removeAttribute('tabindex');
    frame.removeAttribute('role');
    frame.removeAttribute('aria-label');
  }
}

const diagramFrames = Array.from(document.querySelectorAll<HTMLElement>('[data-diagram-frame]'));
diagramFrames.forEach(update);
if (diagramFrames.length > 0 && 'ResizeObserver' in window) {
  const observer = new ResizeObserver((entries) => entries.forEach((entry) => update(entry.target as HTMLElement)));
  diagramFrames.forEach((frame) => observer.observe(frame));
}

// A module, so these names don't leak into (or clash with) the global scope.
export {};
