// Build-time Open Graph images (1200×630 PNG): satori lays out → resvg rasterizes.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export type OgCard = {
  kicker: string;
  title: string;
  subtitle?: string;
  /** Battle layout: two names with a big VS. */
  vs?: [string, string];
};

const require = createRequire(import.meta.url);
const font = (w: number) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));
const fonts = [
  { name: 'Inter', data: font(400), weight: 400 as const },
  { name: 'Inter', data: font(700), weight: 700 as const },
  { name: 'Inter', data: font(900), weight: 900 as const },
];

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

const ORANGE = '#f97316';
const SKY = '#38bdf8';

function layout(card: OgCard): Node {
  const titleSize = card.title.length > 60 ? 56 : card.title.length > 38 ? 66 : 78;
  const body = card.vs
    ? h('div', { display: 'flex', alignItems: 'center', gap: 36, marginTop: 28 }, [
        h('div', { fontSize: 76, fontWeight: 900, color: ORANGE, maxWidth: 440 }, card.vs[0]),
        h('div', { fontSize: 96, fontWeight: 900, fontStyle: 'italic', color: '#fff' }, 'VS'),
        h('div', { fontSize: 76, fontWeight: 900, color: SKY, maxWidth: 440 }, card.vs[1]),
      ])
    : h('div', { fontSize: titleSize, fontWeight: 900, color: '#fff', lineHeight: 1.08, marginTop: 24, maxWidth: 1050 }, card.title);

  return h(
    'div',
    {
      // Satori sizes the content box, so subtract the padding to land exactly on 1200×630.
      width: 1200 - 144, height: 630 - 128, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '64px 72px', fontFamily: 'Inter', color: '#fff',
      backgroundColor: '#0a0a0a',
      backgroundImage: 'radial-gradient(circle at 12% 0%, rgba(249,115,22,0.38), transparent 55%), radial-gradient(circle at 92% 8%, rgba(56,189,248,0.22), transparent 50%)',
    },
    [
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { fontSize: 24, fontWeight: 700, letterSpacing: 6, color: ORANGE, textTransform: 'uppercase' }, card.kicker),
        body,
        card.subtitle ? h('div', { fontSize: 30, color: '#a1a1aa', marginTop: 24, maxWidth: 1000, lineHeight: 1.35 }, card.subtitle) : null,
      ].filter(Boolean)),
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
        h('div', { display: 'flex', fontSize: 44, fontWeight: 900 }, [h('span', {}, 'Rap'), h('span', { color: ORANGE }, 'Rank')]),
        h('div', { fontSize: 26, color: '#71717a' }, 'raprank.org'),
      ]),
    ],
  );
}

export async function renderOg(card: OgCard) {
  const svg = await satori(layout(card) as never, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
