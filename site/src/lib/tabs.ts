/**
 * Keyboard behaviour for <Tabs>, following the WAI-ARIA tabs pattern:
 * Left/Right move between tabs (wrapping), Home/End jump to the ends.
 * Returns the tab index to select, or null if the key isn't ours.
 */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  if (count < 1) return null;
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
