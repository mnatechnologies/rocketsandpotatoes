import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before importing the module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

// Need to set env vars before import
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

import { generateUniqueReference } from '../reference';

describe('generateUniqueReference', () => {
  it('generates a reference with ANB- prefix', async () => {
    const ref = await generateUniqueReference();
    expect(ref).toMatch(/^ANB-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  });

  it('generates 6-character code after prefix', async () => {
    const ref = await generateUniqueReference();
    const code = ref.replace('ANB-', '');
    expect(code).toHaveLength(6);
  });

  it('does not contain ambiguous characters (0, 1, I, L, O)', async () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 20; i++) {
      const ref = await generateUniqueReference();
      const code = ref.replace('ANB-', '');
      expect(code).not.toMatch(/[01ILO]/);
    }
  });

  it('generates unique references', async () => {
    const refs = new Set<string>();
    for (let i = 0; i < 10; i++) {
      refs.add(await generateUniqueReference());
    }
    // With 29^6 = ~594M possibilities, 10 refs should all be unique
    expect(refs.size).toBe(10);
  });

  it('throws after 10 failed attempts', async () => {
    // Override mock to always return existing data (collision)
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'existing' }, error: null })),
          })),
        })),
      })),
    } as ReturnType<typeof createClient>);

    await expect(generateUniqueReference()).rejects.toThrow(
      'Failed to generate unique reference code after 10 attempts'
    );
  });
});
