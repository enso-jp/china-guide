import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { collectionSchemas, type CollectionName } from './lib/schemas';

function jsonCollection(name: CollectionName) {
  return defineCollection({
    loader: glob({
      pattern: '**/*.json',
      base: `./src/content/${name}`,
    }),
    schema: collectionSchemas[name],
  });
}

export const collections = {
  places: jsonCollection('places'),
  attractions: jsonCollection('attractions'),
  dishes: jsonCollection('dishes'),
  festivals: jsonCollection('festivals'),
  food: jsonCollection('food'),
  guides: jsonCollection('guides'),
  routes: jsonCollection('routes'),
  corridors: jsonCollection('corridors'),
  itineraries: jsonCollection('itineraries'),
};
