import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolveTheme } from '../packages/shared/src/theme';
import { validatePublicConfig, loadPublicConfig } from '../scripts/public-config.mjs';
const url = 'https://vbsrwnjyiskbjangbohb.supabase.co';
const key = 'sb_publishable_PA3m399V0GAIkiCGa_1lhg_YCWHdIeS';
describe('Theme preferences', () => {
  it('respects an explicit choice instead of changing it with the system', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
  it('uses the system preference without a saved choice', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme('invalid-value', true)).toBe('dark');
  });
});
describe('Safe public build configuration', () => {
  it('uses the supplied new hosted project and trims a trailing slash', () => {
    expect(
      validatePublicConfig({ SUPABASE_URL: `${url}/`, SUPABASE_PUBLISHABLE_KEY: key }),
    ).toEqual({ supabaseUrl: url, supabasePublishableKey: key });
  });
  it('rejects privileged keys before they can enter a frontend build', () => {
    for (const secret of ['sb_secret_not-for-browser', 'eyJhbGciOiJIUzI1NiJ9', 'service_role']) {
      expect(() =>
        validatePublicConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: secret }),
      ).toThrow('Never use an admin');
    }
  });
  it('rejects credential-bearing, insecure, and unexpected project URLs', () => {
    for (const bad of [
      'http://vbsrwnjyiskbjangbohb.supabase.co',
      'https://user:password@vbsrwnjyiskbjangbohb.supabase.co',
      'https://vbsrwnjyiskbjangbohb.supabase.co/path',
      'https://example.com',
    ]) {
      expect(() =>
        validatePublicConfig({ SUPABASE_URL: bad, SUPABASE_PUBLISHABLE_KEY: key }),
      ).toThrow();
    }
  });
  it('reads cloud environment values before local files', async () => {
    const result = await loadPublicConfig(new URL('file:///no-local-configuration/'), {
      SUPABASE_URL: url,
      SUPABASE_PUBLISHABLE_KEY: key,
      VERCEL: '1',
    });
    expect(result.supabaseUrl).toBe(url);
  });
  it('fails clearly if a cloud build has missing configuration', async () => {
    await expect(
      loadPublicConfig(new URL('file:///no-local-configuration/'), { VERCEL: '1' }),
    ).rejects.toThrow('Set both');
    await expect(
      loadPublicConfig(new URL('file:///no-local-configuration/'), { SUPABASE_URL: url }),
    ).rejects.toThrow('SUPABASE_PUBLISHABLE_KEY');
  });
  it('keeps both applications on one static deployment', async () => {
    const config = JSON.parse(await readFile('vercel.json', 'utf8'));
    expect(config.outputDirectory).toBe('site');
    expect(config.buildCommand).toBe('npm run build:vercel');
    expect(config.redirects).toContainEqual({
      source: '/',
      destination: '/customer/',
      permanent: false,
    });
    expect(config.framework).toBe(null);
  });
});
