import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('../.env', import.meta.url), 'utf8').catch(() =>
  readFile(new URL('../.env.example', import.meta.url), 'utf8'),
);
const env = Object.fromEntries(
  source
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const url = env.SUPABASE_URL;
const key = env.SUPABASE_PUBLISHABLE_KEY;
if (!url?.startsWith('https://') || !key?.startsWith('sb_publishable_'))
  throw new Error(
    'Provide a valid HTTPS Supabase URL and sb_publishable_ key. Never use a secret or service-role key.',
  );
const target = new URL('../packages/shared/src/config.ts', import.meta.url);
const existing = await readFile(target, 'utf8');
const output = existing
  .replace(/supabaseUrl:\s*['"][^'"]*['"]/, `supabaseUrl: ${JSON.stringify(url)}`)
  .replace(
    /supabasePublishableKey:\s*['"][^'"]*['"]/,
    `supabasePublishableKey: ${JSON.stringify(key)}`,
  );
await writeFile(target, output);
console.log('Public configuration updated. Rebuild both applications. No admin keys are included.');
