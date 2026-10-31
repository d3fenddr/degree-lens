import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'out');
let copied = 0;

function flatten(route, directory, parts = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) flatten(route, path, [...parts, entry.name]);
    else if (entry.name.endsWith('.txt')) {
      const target = join(route, [...parts, entry.name].join('.'));
      copyFileSync(path, target);
      if (!existsSync(target)) throw new Error(`Missing exported route asset: ${target}`);
      copied++;
    }
  }
}

function visit(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  if (entries.some(entry => entry.name === 'index.html')) {
    for (const entry of entries.filter(entry => entry.isDirectory() && entry.name.startsWith('__next.'))) flatten(directory, join(directory, entry.name), [entry.name]);
  }
  for (const entry of entries.filter(entry => entry.isDirectory() && !entry.name.startsWith('__next.') && entry.name !== '_next')) visit(join(directory, entry.name));
}

visit(root);
if (copied < 10) throw new Error(`Only ${copied} route assets prepared`);
console.log(`Prepared ${copied} static route assets`);
