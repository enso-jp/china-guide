import { getCollection } from 'astro:content';
import { byGuideOrder, byLaunch, corridorOrder } from './taxonomy';

export type NavLink = { href: string; label: string };
export type NavCard = { href: string; label: string; photo: string };
export type NavColumn = { title: string; href?: string; links: NavLink[] };
export type NavModel = {
  id: string;
  href: string;
  label: string;
  see: string;
  cards: NavCard[];
  columns: NavColumn[];
};

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    out.push(item);
  }
  return out;
}

export async function loadNav(): Promise<NavModel[]> {
  const [places, corridors, itineraries, guides] = await Promise.all([
    getCollection('places'),
    getCollection('corridors'),
    getCollection('itineraries'),
    getCollection('guides'),
  ]);

  const corridorPage = new Set(corridors.map((entry) => entry.id));
  const orderedPlaces = byLaunch(places);

  const destinationColumns: NavColumn[] = corridorOrder.flatMap((corridor) => {
    const links = orderedPlaces
      .filter((place) => place.data.corridor === corridor.id)
      .map((place) => ({ href: `/${place.id}`, label: place.data.name }));
    if (links.length === 0) return [];
    const column: NavColumn = {
      title: corridor.name,
      links,
    };
    if (corridorPage.has(corridor.id)) column.href = `/destinations/${corridor.id}`;
    return [column];
  });

  const interestLinks: NavLink[] = [];
  const interestCards: NavCard[] = [];
  for (const place of orderedPlaces) {
    for (const item of place.data.interests) {
      interestLinks.push({ href: item.href, label: item.title });
      interestCards.push({ href: item.href, label: item.title, photo: item.photo });
    }
  }

  const orderedGuides = byGuideOrder(guides);
  const orderedTrips = [...itineraries].sort((a, b) => a.id.localeCompare(b.id));

  return [
    {
      id: 'destinations',
      href: '/destinations',
      label: 'Destinations',
      see: 'See all destinations',
      cards: orderedPlaces.slice(0, 3).map((place) => ({
        href: `/${place.id}`,
        label: place.data.name,
        photo: place.data.hero,
      })),
      columns: destinationColumns,
    },
    {
      id: 'interests',
      href: '/interests',
      label: 'Interests',
      see: 'See all interests',
      cards: uniqueByHref(interestCards).slice(0, 3),
      columns:
        interestLinks.length === 0
          ? []
          : [{ title: 'Interests', links: uniqueByHref(interestLinks) }],
    },
    {
      id: 'itineraries',
      href: '/itineraries',
      label: 'Itineraries',
      see: 'See all itineraries',
      cards: orderedTrips.slice(0, 3).map((entry) => ({
        href: `/itineraries/${entry.id}`,
        label: entry.data.title,
        photo: entry.data.hero,
      })),
      columns:
        orderedTrips.length === 0
          ? []
          : [
              {
                title: 'Itineraries',
                links: orderedTrips.map((entry) => ({
                  href: `/itineraries/${entry.id}`,
                  label: entry.data.title,
                })),
              },
            ],
    },
    {
      id: 'plan',
      href: '/plan',
      label: 'Plan a trip',
      see: 'See all guides',
      cards: [],
      columns:
        orderedGuides.length === 0
          ? []
          : [
              {
                title: 'Plan a trip',
                href: '/plan',
                links: orderedGuides.map((entry) => ({
                  href: `/plan/${entry.id}`,
                  label: entry.data.title,
                })),
              },
            ],
    },
  ];
}
