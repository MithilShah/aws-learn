/**
 * Turns a page's headings (from Astro's render()) into the section outline
 * shown under the current step in the sidebar: H2s, with their H3s nested.
 */

export interface HeadingLike {
  depth: number;
  slug: string;
  text: string;
}

export interface OutlineSection {
  slug: string;
  text: string;
  children: { slug: string; text: string }[];
}

export function buildOutline(headings: readonly HeadingLike[]): OutlineSection[] {
  const outline: OutlineSection[] = [];
  for (const { depth, slug, text } of headings) {
    if (!slug) continue;
    if (depth === 2) {
      outline.push({ slug, text, children: [] });
    } else if (depth === 3) {
      const parent = outline.at(-1);
      // An H3 before any H2 is shown at the top level rather than dropped.
      if (parent) parent.children.push({ slug, text });
      else outline.push({ slug, text, children: [] });
    }
  }
  return outline;
}
