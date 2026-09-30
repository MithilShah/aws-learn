/**
 * Deterministic element ids for components (figures, steppers, terms), so
 * builds are reproducible and ids are readable in the HTML.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Short, stable hash (djb2, base 36) to tell apart texts that slug alike. */
function shortHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  // Keep every digit: truncating drops the low-order ones, which are exactly
  // what differs between texts that only differ at the end.
  return hash.toString(36);
}

/** e.g. makeId('fig', 'How a change is recorded') -> 'fig-how-a-change-is-recorded-1x2ab' */
export function makeId(prefix: string, text: string): string {
  const slug = slugify(text).slice(0, 40).replace(/-+$/, '');
  return [prefix, slug, shortHash(text)].filter(Boolean).join('-');
}
