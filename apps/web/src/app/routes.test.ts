import { describe, expect, it } from 'vitest';
import { resolveRoute } from './routes';

describe('module entry routes', () => {
  it('preserves root, explicit Scratch and legacy fallback', () => {
    for (const path of ['/', '/scratch', '/scratch/', '/unknown']) {
      expect(resolveRoute(path, false)).toBe('scratch');
    }
  });
  it('isolates Python and keeps the experimental page development-only', () => {
    expect(resolveRoute('/python', false)).toBe('python');
    expect(resolveRoute('/python/', false)).toBe('python');
    expect(resolveRoute('/experiments/editor', true)).toBe('experiment');
    expect(resolveRoute('/experiments/editor', false)).toBe('scratch');
  });
});
