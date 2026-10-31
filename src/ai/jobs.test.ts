import { afterEach, describe, expect, it } from 'vitest';
import { hasRealProvider, resolveAssignments } from './jobs';

const KEYS = [
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'EXPO_PUBLIC_ANTHROPIC_API_KEY',
  'EXPO_PUBLIC_GEMINI_API_KEY',
  'EXPO_PUBLIC_GOOGLE_API_KEY',
];

function clearKeys() {
  for (const k of KEYS) delete process.env[k];
}

afterEach(clearKeys);

describe('job assignment', () => {
  it('defaults every job to the demo provider with no keys (free-first)', () => {
    clearKeys();
    expect(hasRealProvider()).toBe(false);
    const a = resolveAssignments();
    for (const job of Object.values(a)) {
      expect(job.provider).toBe('demo');
    }
  });

  it('assigns planning + teaching to Anthropic and items + feedback to Gemini when both keys exist', () => {
    clearKeys();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic';
    process.env.GEMINI_API_KEY = 'test-gemini';
    expect(hasRealProvider()).toBe(true);
    const a = resolveAssignments();
    expect(a.ladder_planning.provider).toBe('anthropic');
    expect(a.teaching.provider).toBe('anthropic');
    expect(a.item_generation.provider).toBe('gemini');
    expect(a.feedback.provider).toBe('gemini');
    // Embeddings stay local regardless of keys.
    expect(a.embeddings.provider).toBe('demo');
    expect(a.embeddings.model).toBe('local');
  });

  it('accepts GOOGLE_API_KEY as an alias for GEMINI_API_KEY', () => {
    clearKeys();
    process.env.GOOGLE_API_KEY = 'test-google';
    const a = resolveAssignments();
    expect(a.item_generation.provider).toBe('gemini');
    expect(a.feedback.provider).toBe('gemini');
  });

  it('falls back to whichever provider is configured, else demo', () => {
    clearKeys();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic';
    const a = resolveAssignments();
    // Gemini jobs fall back to Anthropic when no Gemini key exists.
    expect(a.item_generation.provider).toBe('anthropic');
    expect(a.feedback.provider).toBe('anthropic');
  });
});
