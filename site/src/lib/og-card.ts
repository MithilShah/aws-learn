/**
 * Share card (1200×630 PNG) for LinkedIn / X / Slack, rendered at build time.
 * Ported from the book's og-card.ts: satori lays out an element tree as SVG,
 * resvg rasterises it. Fonts and logo are read from disk, so rendering needs
 * no network and gives the same output every build.
 *
 * Used by src/pages/og/[...path].png.ts.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { publicDir } from 'astro:config/server';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { SHARE_IMAGE } from './seo';

// The endpoint runs from a compiled chunk, not from src/, so resolve fonts
// through Node's resolver and the logo through Astro's publicDir.
const require = createRequire(import.meta.url);
const font = (weight: 400 | 700 | 800) => ({
  name: 'Inter',
  weight,
  style: 'normal' as const,
  // satori reads .woff (not .woff2).
  data: readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`)),
});
const FONTS = [font(400), font(700), font(800)];

const LOGO = {
  src: `data:image/png;base64,${readFileSync(new URL('studytrails-logo.png', publicDir)).toString('base64')}`,
  // Intrinsic size 289×71, drawn 40px tall.
  width: Math.round((289 / 71) * 40),
  height: 40,
};

// satori takes a React-element-like tree; plain objects avoid JSX in a .ts
// file. Any element with more than one child must be display:flex.
type Style = Record<string, string | number>;
interface Node {
  type: string;
  props: { style?: Style; children?: unknown; [key: string]: unknown };
}
const el = (type: string, style: Style, children?: unknown): Node => ({ type, props: { style, children } });

// A type alias (not an interface) so it fits getStaticPaths' props record.
export type CardInput = {
  /** Small caps line above the title, e.g. 'AWS Config · Step 2 of 6'. */
  eyebrow: string;
  title: string;
  summary?: string;
  /** Journey position: draws one bar per step, highlighting `current`. */
  steps?: { total: number; current?: number };
};

/** Smaller type for longer titles so two lines always fit. */
function titleSize(title: string): number {
  if (title.length > 44) return 56;
  if (title.length > 30) return 62;
  return 70;
}

function stepBars({ total, current }: { total: number; current?: number }): Node {
  const bars = Array.from({ length: total }, (_, i) =>
    el('div', {
      width: 56,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
      background: current === i + 1 ? '#ffffff' : current && i + 1 < current ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
    }),
  );
  return el('div', { display: 'flex', marginTop: 36 }, bars);
}

function cardTree({ eyebrow, title, summary, steps }: CardInput): Node {
  const body: Node[] = [
    el('div', { fontSize: 22, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.88 }, eyebrow),
    el('div', { marginTop: 16, fontSize: titleSize(title), fontWeight: 800, lineHeight: 1.08, maxWidth: 1000 }, title),
  ];
  if (summary) {
    body.push(
      el(
        'div',
        // ~75 characters per line at this size; three lines fit every summary.
        { marginTop: 22, fontSize: 26, fontWeight: 400, lineHeight: 1.35, maxWidth: 1000, opacity: 0.92, display: 'block', lineClamp: 3 },
        summary,
      ),
    );
  }
  if (steps && steps.total > 0) body.push(stepBars(steps));

  return el(
    'div',
    {
      width: SHARE_IMAGE.width,
      height: SHARE_IMAGE.height,
      display: 'flex',
      flexDirection: 'column',
      padding: '64px 96px',
      color: '#ffffff',
      fontFamily: 'Inter',
      // Same violet → indigo → teal as the book's cards.
      backgroundImage: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 58%, #0d9488 130%)',
    },
    [
      // Brand chip: white pill with the StudyTrails logo.
      el('div', { display: 'flex', alignSelf: 'flex-start', background: '#ffffff', borderRadius: 12, padding: '12px 20px' }, [
        { type: 'img', props: { src: LOGO.src, width: LOGO.width, height: LOGO.height, style: { width: LOGO.width, height: LOGO.height } } },
      ]),
      el('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }, body),
      el('div', { display: 'flex', justifyContent: 'space-between', fontSize: 24, fontWeight: 700, opacity: 0.92 }, [
        el('div', { display: 'flex' }, 'by Mithil Shah'),
        el('div', { display: 'flex' }, 'studytrails.com/aws-learn'),
      ]),
    ],
  );
}

export async function renderCard(input: CardInput): Promise<Buffer> {
  const svg = await satori(cardTree(input) as unknown as Parameters<typeof satori>[0], {
    width: SHARE_IMAGE.width,
    height: SHARE_IMAGE.height,
    fonts: FONTS,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: SHARE_IMAGE.width } }).render().asPng();
}
