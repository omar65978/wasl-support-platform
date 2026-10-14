import { cp, mkdir } from 'node:fs/promises';
const app = process.argv[2];
if (!['customer', 'support'].includes(app)) throw new Error('Choose customer or support.');
const root = new URL('../', import.meta.url);
const destination = new URL(`apps/${app}/public/`, root);
await mkdir(destination, { recursive: true });
await cp(new URL('assets/browser/theme-init.js', root), new URL('theme-init.js', destination));
