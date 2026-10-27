/** Launch order for live cities. Later places sort after these. */
export const launchOrder = [
  'shanghai',
  'hangzhou',
  'suzhou',
  'beijing',
  'xian',
  'chengdu',
] as const;

export const corridorOrder = [
  { id: 'yangtze-delta', name: 'Yangtze Delta' },
  { id: 'north-china', name: 'North China' },
  { id: 'yellow-river', name: 'The Yellow River' },
  { id: 'southwest', name: 'Southwest China' },
] as const;

export const guideOrder = [
  'when-to-go',
  'entry-and-visa',
  'paying',
  'trains',
  'flights',
] as const;

export function byLaunch<T extends { id: string }>(entries: T[]): T[] {
  const rank = new Map<string, number>(launchOrder.map((id, index) => [id, index]));
  return [...entries].sort((a, b) => {
    const delta = (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000);
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
}

export function byGuideOrder<T extends { id: string }>(entries: T[]): T[] {
  const rank = new Map<string, number>(guideOrder.map((id, index) => [id, index]));
  return [...entries].sort((a, b) => {
    const delta = (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000);
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
}
