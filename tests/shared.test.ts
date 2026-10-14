import { beforeEach, describe, expect, it } from 'vitest';
import {
  canManage,
  defaultFilters,
  validateFile,
  validateRequest,
} from '../packages/shared/src/types';
import { ar, en, errorKey } from '../packages/shared/src/i18n';
import { DemoRepository, demoProfile, resetDemo } from '../packages/shared/src/demo';
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
});
beforeEach(() => resetDemo());
describe('Shared product rules', () => {
  it('keeps Arabic and English translation coverage identical', () =>
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort()));
  it('validates trimmed request inputs', () => {
    expect(() =>
      validateRequest({
        title: '    ',
        description: 'A sufficiently long description here',
        category: 'general',
        urgency: 'normal',
      }),
    ).toThrow('INVALID_TITLE');
    expect(() =>
      validateRequest({
        title: 'A clear title',
        description: 'short',
        category: 'general',
        urgency: 'normal',
      }),
    ).toThrow('INVALID_DESCRIPTION');
  });
  it('maps concurrency and authorization failures to actionable copy', () => {
    expect(errorKey(new Error('CONFLICT'))).toBe('errorConflict');
    expect(errorKey({ code: '42P01' })).toBe('errorSetup');
    expect(errorKey(new Error('NOT_OWNER'))).toBe('errorOwner');
  });
  it('rejects disguised executable files', async () => {
    const file = new File(['<script>alert(1)</script>'], 'invoice.pdf', {
      type: 'application/pdf',
    });
    await expect(validateFile(file)).rejects.toThrow('INVALID_FILE');
  });
  it('accepts supported signatures and rejects empty files', async () => {
    await expect(
      validateFile(new File(['%PDF-1.7 test'], 'invoice.pdf', { type: 'application/pdf' })),
    ).resolves.toBeUndefined();
    await expect(
      validateFile(new File([], 'empty.pdf', { type: 'application/pdf' })),
    ).rejects.toThrow('FILE_SIZE');
  });
  it('does not grant ownership privileges to every support agent', async () => {
    const repo = new DemoRepository(() => demoProfile('customer'));
    const r = (await repo.list(defaultFilters())).items[1];
    expect(canManage(demoProfile('agent'), r)).toBe(false);
    expect(canManage(demoProfile('manager'), r)).toBe(true);
  });
  it('pages demo results instead of returning the complete dataset', async () => {
    const repo = new DemoRepository(() => demoProfile('manager'));
    const page = await repo.list(defaultFilters());
    expect(page.items.length).toBe(12);
    expect(page.total).toBe(18);
    const second = await repo.list({ ...defaultFilters(), page: 2 });
    expect(second.items.length).toBe(6);
    expect(second.items.some((r) => page.items.some((x) => x.id === r.id))).toBe(false);
  });
  it('keeps demo internal notes separate from customer messages', async () => {
    const customer = new DemoRepository(() => demoProfile('customer'));
    const agent = new DemoRepository(() => demoProfile('agent'));
    const id = (await customer.list(defaultFilters())).items[0].id;
    expect((await customer.detail(id)).messages.every((m) => !m.internal)).toBe(true);
    expect((await agent.detail(id)).messages.some((m) => m.internal)).toBe(true);
  });
  it('preserves canonical state after a rejected stale mutation', async () => {
    const customer = new DemoRepository(() => demoProfile('customer'));
    const agent = new DemoRepository(() => demoProfile('agent'));
    const id = await customer.create({
      title: 'A new demo request',
      description: 'Something is wrong with the latest download workflow.',
      category: 'technical',
      urgency: 'normal',
    });
    await agent.change(id, 1, 'claim');
    await expect(agent.change(id, 1, 'resolve', 'We fixed the issue.')).rejects.toThrow('CONFLICT');
    expect((await agent.detail(id)).request.status).toBe('in_progress');
  });
});
