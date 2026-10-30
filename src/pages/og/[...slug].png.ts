import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgPages } from '../../lib/og-pages';
import { renderOg, type OgCard } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () =>
  [...(await getOgPages())].map(([slug, card]) => ({ params: { slug }, props: { card } }));

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderOg((props as { card: OgCard }).card), { headers: { 'Content-Type': 'image/png' } });
