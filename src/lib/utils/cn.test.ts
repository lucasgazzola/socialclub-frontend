import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('la clase de color que llega después gana sobre la variante', () => {
    expect(cn('text-slate-600 hover:bg-slate-100', 'text-rose-600 hover:bg-rose-50')).toBe(
      'text-rose-600 hover:bg-rose-50',
    );
  });

  it('descarta los valores falsos', () => {
    const oculto = false;
    expect(cn('px-2', oculto && 'hidden', undefined, 'py-1')).toBe('px-2 py-1');
  });
});
