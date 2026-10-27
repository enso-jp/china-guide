import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const limits = {
  totalBytes: 1_500_000,
  jsBytes: 200_000,
  cssBytes: 150_000,
  imageBytes: 320 * 1024,
};

const banned = [
  'facts verified',
  'confirm before you go',
  'paid link',
  'may earn a commission',
  'this link may earn',
  'see this site',
  'legal gazetteer',
  'vietnam-travelguide.com',
  'klook.tpx.li',
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const errors = [];
let files = [];
try {
  files = await walk(dist);
} catch {
  console.error('check:size failed: dist/ is missing. Run the build first.');
  process.exit(1);
}

let total = 0;
let js = 0;
let css = 0;

for (const file of files) {
  const info = await stat(file);
  total += info.size;
  const ext = path.extname(file).toLowerCase();
  if (ext === '.js') js += info.size;
  if (ext === '.css') css += info.size;
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) && info.size > limits.imageBytes) {
    errors.push(`${path.relative(root, file)} is over 320 KB`);
  }
  if (ext === '.html') {
    const html = (await readFile(file, 'utf8')).toLowerCase();
    for (const phrase of banned) {
      if (html.includes(phrase)) errors.push(`${path.relative(root, file)} contains “${phrase}”`);
    }
  }
}

if (total > limits.totalBytes) errors.push(`dist is ${total} bytes; budget is ${limits.totalBytes}`);
if (js > limits.jsBytes) errors.push(`JavaScript is ${js} bytes; budget is ${limits.jsBytes}`);
if (css > limits.cssBytes) errors.push(`CSS is ${css} bytes; budget is ${limits.cssBytes}`);

if (errors.length > 0) {
  for (const message of errors) console.error(message);
  console.error(`check:size failed (${errors.length})`);
  process.exit(1);
}

console.log(
  `check:size ok (total ${total}, js ${js}, css ${css}, files ${files.length})`,
);
