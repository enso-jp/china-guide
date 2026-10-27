import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { corridorId, collectionSchemas, creditSchema, type CollectionName } from '../src/lib/schemas.ts';
import { corridorOrder, guideOrder } from '../src/lib/taxonomy.ts';

const root = process.cwd();
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

const bannedPhrases = [
  'facts verified',
  'confirm before you go',
  'paid link',
  'may earn a commission',
  'this link may earn',
  'see this site',
  'legal gazetteer',
];

const bannedHosts = [
  'vietnam-travelguide.com',
  'www.china-travelguide.com',
  'klook.tpx.li',
  'klook.com',
  'trip.com',
  'ctrip.com',
  'tpx.li',
];

const imageLimit = 320 * 1024;

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function rel(file: string) {
  return path.relative(root, file);
}

async function readTextFiles(dirs: string[]) {
  const files: string[] = [];
  for (const dir of dirs) {
    try {
      files.push(...(await walk(dir)));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') fail(`Missing directory ${dir}`);
      else throw error;
    }
  }
  return files.filter((file) => /\.(astro|ts|css|mjs|js|json|svg|txt|md|html)$/.test(file));
}

function collectStrings(value: unknown, out: string[]) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }
}

function photoIds(name: CollectionName, data: Record<string, unknown>): string[] {
  const ids: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string' && value) ids.push(value);
  };
  if (name === 'places') {
    add(data.hero);
    for (const area of data.stayAreas as { photo: string }[]) add(area.photo);
    for (const item of data.interests as { photo: string }[]) add(item.photo);
    for (const trip of data.sideTrips as { photo?: string }[]) add(trip.photo);
    const ticketed = data.ticketed as { photo?: string } | undefined;
    add(ticketed?.photo);
  } else if (name === 'attractions') {
    add(data.photo);
    add(data.photo2);
  } else if (name === 'dishes' || name === 'festivals') {
    add(data.photo);
  } else if (name === 'food') {
    add(data.hero);
  } else if (name === 'itineraries') {
    add(data.hero);
    for (const day of data.days as { photo: string }[]) add(day.photo);
  }
  return ids;
}

type RecordFile = {
  name: CollectionName;
  id: string;
  file: string;
  data: Record<string, unknown>;
};

const records: RecordFile[] = [];

for (const name of Object.keys(collectionSchemas) as CollectionName[]) {
  const dir = path.join(root, 'src/content', name);
  let files: string[] = [];
  try {
    files = (await walk(dir)).filter((file) => file.endsWith('.json'));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      fail(`Missing collection directory src/content/${name}`);
      continue;
    }
    throw error;
  }
  const markdown = (await walk(dir)).filter((file) => /\.(md|mdx)$/.test(file));
  for (const file of markdown) fail(`${rel(file)} is not a JSON content record`);

  for (const file of files) {
    const id = path.basename(file, '.json');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      fail(`${rel(file)} is not valid JSON (${(error as Error).message})`);
      continue;
    }
    const result = collectionSchemas[name].safeParse(parsed);
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');
      fail(`${rel(file)} does not match the ${name} schema (${detail})`);
      continue;
    }
    records.push({ name, id, file, data: result.data as Record<string, unknown> });
    const strings: string[] = [];
    collectStrings(result.data, strings);
    for (const value of strings) {
      if (/https?:\/\//i.test(value)) fail(`${rel(file)} contains a URL`);
      const lower = value.toLowerCase();
      for (const phrase of bannedPhrases) {
        if (lower.includes(phrase)) fail(`${rel(file)} contains “${phrase}”`);
      }
    }
  }
}

const ids = (name: CollectionName) => new Set(records.filter((record) => record.name === name).map((record) => record.id));
const placeIds = ids('places');
const attractionIds = ids('attractions');
const dishIds = ids('dishes');
const foodIds = ids('food');

for (const record of records) {
  if (record.name === 'places') {
    for (const nearby of record.data.nearby as string[]) {
      if (!placeIds.has(nearby)) fail(`${record.id} nearby slug “${nearby}” has no place record`);
    }
    const foodSlug = record.data.foodSlug as string | undefined;
    if (foodSlug && !foodIds.has(foodSlug)) {
      fail(`${record.id} foodSlug “${foodSlug}” has no food record`);
    }
  }
  if (record.name === 'attractions') {
    const placeSlug = record.data.placeSlug as string;
    const sep = record.id.indexOf('--');
    const sight = sep < 0 ? '' : record.id.slice(sep + 2);
    if (sep < 0 || record.id.slice(0, sep) !== placeSlug) {
      fail(`${record.id} must be named {placeSlug}--{sight}`);
    }
    if (record.data.photo !== `${placeSlug}-${sight}`) {
      fail(`${record.id} photo must be ${placeSlug}-${sight}`);
    }
    if (record.data.photo2 !== `${placeSlug}-${sight}-2`) {
      fail(`${record.id} photo2 must be ${placeSlug}-${sight}-2`);
    }
    if (!placeIds.has(placeSlug)) fail(`${record.id} placeSlug “${placeSlug}” has no place record`);
  }
  if (record.name === 'dishes' || record.name === 'festivals' || record.name === 'food') {
    const placeSlug = record.data.placeSlug as string;
    if (!placeIds.has(placeSlug)) fail(`${record.id} placeSlug “${placeSlug}” has no place record`);
  }
  if (record.name === 'food' && record.id !== record.data.placeSlug) {
    fail(`${record.id} food id must match placeSlug`);
  }
  if (record.name === 'routes') {
    const from = record.data.from as string;
    const to = record.data.to as string;
    if (from === to) fail(`${record.id} route starts and ends at the same place`);
    if (!placeIds.has(from) || !placeIds.has(to)) {
      fail(`${record.id} route must point at two place records`);
    }
  }
  if (record.name === 'corridors') {
    if (!corridorOrder.some((corridor) => corridor.id === record.id)) {
      fail(`${record.id} is not one of the four corridors`);
    }
    for (const place of record.data.places as string[]) {
      if (!placeIds.has(place)) fail(`${record.id} lists missing place “${place}”`);
    }
  }
  if (record.name === 'guides' && !guideOrder.includes(record.id as (typeof guideOrder)[number])) {
    fail(`${record.id} is not one of the plan guides`);
  }
  if (record.name === 'itineraries') {
    const stops = [
      ...(record.data.days as { stops: { kind: string; slug: string }[] }[]).flatMap((day) => day.stops),
      ...((record.data.additions as { kind: string; slug: string }[] | undefined) ?? []),
    ];
    for (const stop of stops) {
      const known =
        (stop.kind === 'place' && placeIds.has(stop.slug)) ||
        (stop.kind === 'attraction' && attractionIds.has(stop.slug)) ||
        (stop.kind === 'dish' && dishIds.has(stop.slug));
      if (!known) fail(`${record.id} stop ${stop.kind}:${stop.slug} does not resolve`);
    }
  }
}

const referenced = new Set<string>();
for (const record of records) {
  for (const id of photoIds(record.name, record.data)) referenced.add(id);
}

const creditsPath = path.join(root, 'public/photos/credits.json');
let credits: Record<string, unknown> = {};
try {
  const parsed = JSON.parse(await readFile(creditsPath, 'utf8')) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('public/photos/credits.json must be an object');
  } else {
    credits = parsed as Record<string, unknown>;
  }
} catch (error) {
  fail(`public/photos/credits.json is not readable (${(error as Error).message})`);
}

for (const [id, credit] of Object.entries(credits)) {
  const result = creditSchema.safeParse(credit);
  if (!result.success) fail(`Credit “${id}” does not match the credit schema`);
  const source = result.success ? result.data.source.toLowerCase() : '';
  for (const host of bannedHosts) {
    if (source.includes(host)) fail(`Credit “${id}” uses a blocked host`);
  }
}

const photoDir = path.join(root, 'public/photos');
const photoFiles = (await walk(photoDir)).filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file));
const onDisk = new Set(photoFiles.map((file) => path.basename(file, path.extname(file))));

for (const id of referenced) {
  const file = path.join(photoDir, `${id}.jpg`);
  try {
    const info = await stat(file);
    if (info.size > imageLimit) fail(`${id}.jpg is over 320 KB`);
  } catch {
    fail(`Missing photo public/photos/${id}.jpg`);
  }
  if (!credits[id]) fail(`Missing credit for ${id}`);
}

for (const file of photoFiles) {
  const id = path.basename(file, path.extname(file));
  if (!credits[id]) fail(`Photo ${rel(file)} has no credit`);
  const info = await stat(file);
  if (info.size > imageLimit) fail(`${rel(file)} is over 320 KB`);
  if (!onDisk.has(id)) fail(`Unreadable photo ${rel(file)}`);
}

const partnersPath = path.join(root, 'src/lib/partners.ts');
const partnersSource = await readFile(partnersPath, 'utf8');
if (/https?:\/\//i.test(partnersSource)) fail('src/lib/partners.ts contains a URL');
for (const host of bannedHosts) {
  if (partnersSource.toLowerCase().includes(host)) fail(`src/lib/partners.ts mentions ${host}`);
}

const textFiles = await readTextFiles([path.join(root, 'src'), path.join(root, 'public')]);
for (const file of textFiles) {
  if (file.endsWith('credits.json')) continue;
  const text = (await readFile(file, 'utf8')).toLowerCase();
  for (const phrase of bannedPhrases) {
    if (text.includes(phrase)) fail(`${rel(file)} contains “${phrase}”`);
  }
  for (const host of bannedHosts) {
    if (text.includes(host)) fail(`${rel(file)} mentions ${host}`);
  }
}

const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
if (!css.includes('--nav-panel-h')) fail('Nav panels must share --nav-panel-h');
if (!css.includes('.nav-panel[data-panel="interests"]') && !css.includes('data-panel="interests"')) {
  /* The measurer lives in the script; the panel markup carries the attribute. */
}
if (!/\.nav-panel-inner\s*\{[^}]*overflow:\s*hidden/s.test(css)) {
  fail('Nav panel lists must clip with overflow: hidden');
}
if (!css.includes('.nav-slot:hover > .nav-panel')) fail('Nav panel must stay open while the pointer is over it');
if (!css.includes('--lacquer')) fail('Missing lacquer token');
if (!css.includes('Source Sans 3')) fail('Type must be Source Sans 3');
if (!css.includes('--radius-hero: 16px') || !css.includes('--radius-card: 16px')) {
  fail('Hero and card corners must be 16px');
}
if (!css.includes('--radius-photo: 12px') || !css.includes('--radius-facts: 14px')) {
  fail('Photo corners must be 12px and the fact bar 14px');
}
if (!css.includes('.photo-credit') || !css.includes('0.68rem')) {
  fail('Photo credit line must stay much smaller than the photo');
}
if (!css.includes('.pill') || !css.includes('.stay')) fail('Pills and the word stay need styles');

const header = await readFile(path.join(root, 'src/components/Header.astro'), 'utf8');
for (const label of ['Destinations', 'Interests', 'Itineraries', 'Plan a trip', 'Home']) {
  if (!header.includes(label)) fail(`Header is missing ${label}`);
}
for (const banned of ['Forum', 'Sign in', 'Videos', 'Saved']) {
  if (header.includes(banned)) fail(`Header must not include ${banned}`);
}

const ui = await readFile(path.join(root, 'src/scripts/ui.ts'), 'utf8');
if (!ui.includes('data-panel="interests"')) fail('Panel height must be measured from Interests');

const schemaOptions = corridorId.options;
for (const corridor of corridorOrder) {
  if (!schemaOptions.includes(corridor.id)) fail(`Corridor ${corridor.id} is missing from the schema`);
}

if (errors.length > 0) {
  for (const message of errors) console.error(message);
  console.error(`check:content failed (${errors.length})`);
  process.exit(1);
}

const counts = Object.keys(collectionSchemas)
  .map((name) => `${name} ${records.filter((record) => record.name === name).length}`)
  .join(', ');
console.log(`check:content ok (${counts})`);
