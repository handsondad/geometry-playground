#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const item of ['index.html', 'style.css', 'src', 'public']) {
  fs.cpSync(path.join(ROOT, item), path.join(DIST, item), { recursive: true });
}
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
console.log('Built static GitHub Pages bundle in dist/.');
