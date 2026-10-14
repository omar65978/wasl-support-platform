import { readFile, writeFile } from 'node:fs/promises';
import { loadPublicConfig } from './public-config.mjs';
const root = new URL('../', import.meta.url);
const values = await loadPublicConfig(root);
const target = new URL('packages/shared/src/config.ts', root);
const existing = await readFile(target, 'utf8');
const output = existing
  .replace(/supabaseUrl:\s*['"][^'"]*['"]/, `supabaseUrl: '${values.supabaseUrl}'`)
  .replace(
    /supabasePublishableKey:\s*['"][^'"]*['"]/,
    `supabasePublishableKey: '${values.supabasePublishableKey}'`,
  );
if (output !== existing) await writeFile(target, output);
console.log(
  `Public configuration ready for ${new URL(values.supabaseUrl).hostname}. No administrative credentials are used.`,
);
