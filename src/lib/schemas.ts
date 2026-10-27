import { z } from 'astro/zod';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const photoId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const internalPath = z
  .string()
  .regex(/^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/);

export const corridorId = z.enum([
  'yangtze-delta',
  'north-china',
  'yellow-river',
  'southwest',
]);

const stopKind = z.enum(['place', 'attraction', 'dish']);

export const placeSchema = z.strictObject({
  name: z.string().min(1),
  corridor: corridorId,
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  lede: z.string().min(1),
  intro: z.array(z.string().min(1)).min(1),
  dots: z.number().int().min(1).max(5),
  season: z.strictObject({
    label: z.string().min(1),
    note: z.string().min(1),
  }),
  interestChips: z.array(
    z.strictObject({
      label: z.string().min(1),
      href: internalPath,
    }),
  ),
  interests: z.array(
    z.strictObject({
      title: z.string().min(1),
      summary: z.string().min(1),
      href: internalPath,
      photo: photoId,
    }),
  ),
  hero: photoId,
  facts: z.strictObject({
    timeNeeded: z.string().min(1),
    gettingThere: z.string().min(1),
    bestMonths: z.string().min(1),
  }),
  nearby: z.array(slug),
  stayAreas: z.array(
    z.strictObject({
      name: z.string().min(1),
      summary: z.string().min(1),
      band: z.string().min(1),
      photo: photoId,
    }),
  ),
  questions: z.array(
    z.strictObject({
      q: z.string().min(1),
      a: z.string().min(1),
    }),
  ),
  gettingThere: z.string().min(1),
  sideTrips: z.array(
    z.strictObject({
      name: z.string().min(1),
      summary: z.string().min(1),
      href: internalPath.optional(),
      photo: photoId.optional(),
    }),
  ),
  ticketed: z
    .strictObject({
      name: z.string().min(1),
      summary: z.string().min(1),
      photo: photoId,
      href: internalPath.optional(),
    })
    .optional(),
  foodSlug: slug.optional(),
});

export const attractionSchema = z.strictObject({
  placeSlug: slug,
  name: z.string().min(1),
  district: z.string().min(1),
  kicker: z.string().min(1),
  notice: z.string().min(1),
  body: z.string().min(1),
  gettingThere: z.string().min(1),
  hours: z.string().min(1),
  fees: z.string().min(1),
  photo: photoId,
  photo2: photoId,
});

export const dishSchema = z.strictObject({
  placeSlug: slug,
  name: z.string().min(1),
  summary: z.string().min(1),
  taste: z.string().min(1).optional(),
  history: z.string().min(1).optional(),
  texture: z.string().min(1).optional(),
  howToEat: z.string().min(1).optional(),
  hours: z.string().min(1).optional(),
  price: z.string().min(1).optional(),
  photo: photoId.optional(),
});

export const festivalSchema = z.strictObject({
  placeSlug: slug,
  name: z.string().min(1),
  summary: z.string().min(1),
  when: z.string().min(1).optional(),
  where: z.string().min(1),
  photo: photoId.optional(),
});

export const foodGuideSchema = z.strictObject({
  placeSlug: slug,
  name: z.string().min(1),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  intro: z.array(z.string().min(1)).min(1),
  hero: photoId,
});

export const guideSchema = z.strictObject({
  title: z.string().min(1),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  intro: z.array(z.string().min(1)).min(1),
});

export const routeSchema = z.strictObject({
  from: slug,
  to: slug,
  mode: z.enum(['train', 'flight', 'other']),
  summary: z.string().min(1),
});

export const corridorSchema = z.strictObject({
  name: z.string().min(1),
  sellingPoint: z.string().min(1),
  places: z.array(slug),
});

export const itinerarySchema = z.strictObject({
  title: z.string().min(1),
  kind: z.enum(['nationwide', 'regional', 'local', 'weekend']),
  duration: z.string().min(1),
  summary: z.string().min(1),
  hero: photoId,
  budget: z.string().min(1).optional(),
  pace: z.string().min(1).optional(),
  byTrain: z.boolean().optional(),
  gettingThere: z.string().min(1).optional(),
  days: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        photo: photoId,
        summary: z.string().min(1),
        stops: z.array(
          z.strictObject({
            kind: stopKind,
            slug: z.string().min(1),
            minutes: z.number().int().nonnegative().optional(),
          }),
        ),
      }),
    )
    .min(1),
  additions: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        kind: stopKind,
        slug: z.string().min(1),
      }),
    )
    .optional(),
});

export const creditSchema = z.strictObject({
  author: z.string().min(1),
  license: z.string().min(1),
  source: z.string().url(),
});

export const collectionSchemas = {
  places: placeSchema,
  attractions: attractionSchema,
  dishes: dishSchema,
  festivals: festivalSchema,
  food: foodGuideSchema,
  guides: guideSchema,
  routes: routeSchema,
  corridors: corridorSchema,
  itineraries: itinerarySchema,
} as const;

export type CollectionName = keyof typeof collectionSchemas;
