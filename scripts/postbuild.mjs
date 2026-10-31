import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'out');
for (const route of readdirSync(root, { withFileTypes:true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))) {
  const directory = join(root, route.name);
  for (const entry of readdirSync(directory, { withFileTypes:true }).filter(entry => entry.isDirectory() && entry.name.startsWith('__next.'))) {
    const source = join(directory, entry.name, '__PAGE__.txt');
    if (!existsSync(source)) continue;
    const target = join(directory, `${entry.name}.__PAGE__.txt`);
    copyFileSync(source, target);
    if (!existsSync(target)) throw new Error(`Missing exported route asset: ${target}`);
  }
}
