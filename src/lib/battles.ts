import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Tool } from './data';

export type Battle = CollectionEntry<'battles'>;

/** Media paths are relative to public/; a missing file means "not generated yet". */
export function mediaExists(media?: string) {
  return !!media && existsSync(join(process.cwd(), 'public', media));
}

export async function getBattle(battle: Battle) {
  const [a, b] = (await Promise.all([getEntry(battle.data.a), getEntry(battle.data.b)])) as [Tool, Tool];
  if (!a || !b) throw new Error(`Battle "${battle.id}" references a missing tool`);
  if (!a.data.verified || !b.data.verified) throw new Error(`Battle "${battle.id}" uses an unverified tool`);
  const rounds = battle.data.rounds.map((r) => ({
    ...r,
    ready: mediaExists(r.a.media) && mediaExists(r.b.media),
  }));
  return { battle, a, b, rounds };
}

export async function getBattles() {
  return Promise.all((await getCollection('battles')).map(getBattle));
}

export async function getBattlesFor(toolId: string) {
  return (await getBattles()).filter(({ a, b }) => a.id === toolId || b.id === toolId);
}

export const battleTitle = (a: Tool, b: Tool) => `${a.data.name} vs ${b.data.name}`;
