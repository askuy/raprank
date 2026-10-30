// One-off: render brand PNGs from public/favicon.svg. Re-run after changing the icon.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('public/favicon.svg', 'utf8');
// iOS fills transparency with black and rounds corners itself, so use a full-bleed square.
const square = svg.replace('rx="14"', 'rx="0"');
const png = (s, size) => new Resvg(s, { fitTo: { mode: 'width', value: size } }).render().asPng();

writeFileSync('public/apple-touch-icon.png', png(square, 180));
writeFileSync('public/logo.png', png(svg, 512));
writeFileSync('/tmp/favicon-48.png', png(svg, 48));
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', '/tmp/favicon-48.png', 'public/favicon.ico']);
console.log('Wrote apple-touch-icon.png, logo.png, favicon.ico');
