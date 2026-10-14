import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
export function validatePublicConfig(values) {
  const rawUrl = values.SUPABASE_URL?.trim();
  const key = values.SUPABASE_PUBLISHABLE_KEY?.trim();
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('SUPABASE_URL must be a valid hosted Supabase HTTPS URL.');
  }
  if (
    url.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error(
      'Use the hosted project URL, without credentials, paths, query strings, or fragments.',
    );
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key || '')) {
    throw new Error(
      'SUPABASE_PUBLISHABLE_KEY must start with sb_publishable_. Never use an admin, secret, or service-role key in frontend configuration.',
    );
  }
  return { supabaseUrl: url.origin, supabasePublishableKey: key };
}
export async function loadPublicConfig(root, environment = process.env) {
  if (
    environment.SUPABASE_URL !== undefined ||
    environment.SUPABASE_PUBLISHABLE_KEY !== undefined
  ) {
    return validatePublicConfig(environment);
  }
  if (environment.VERCEL) {
    throw new Error(
      'Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel Project Settings before building.',
    );
  }
  let source;
  try {
    source = await readFile(new URL('.env', root), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    source = await readFile(new URL('.env.example', root), 'utf8');
  }
  return validatePublicConfig(parseEnv(source));
}
