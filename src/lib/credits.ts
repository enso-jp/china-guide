import raw from '../../public/photos/credits.json';

export type Credit = {
  author: string;
  license: string;
  source: string;
};

const credits = raw as Record<string, Credit>;

export function creditFor(id: string): Credit | null {
  return credits[id] ?? null;
}
