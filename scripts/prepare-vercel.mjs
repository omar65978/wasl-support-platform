import { cp, mkdir, rm, access, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const output = new URL('site/', root);
const apps = { customer: 'apps/customer/dist/', support: 'apps/support/dist/browser/' };
for (const source of Object.values(apps)) await access(new URL(`${source}index.html`, root));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const [app, source] of Object.entries(apps)) {
  await cp(new URL(source, root), new URL(`${app}/`, output), { recursive: true });
}
await writeFile(new URL('health', output), JSON.stringify({ status: 'ok' }));
console.log('Static deployment ready: site/customer/ and site/support/.');
