import { afterEach, describe, expect, it, vi } from 'vitest';
import { consumirVolverA, recordarVolverA } from './volverA';

describe('TASK-60 · volverA', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('devuelve la ruta guardada una sola vez', () => {
    recordarVolverA('/asociarme?plan=2');
    expect(consumirVolverA()).toBe('/asociarme?plan=2');
    expect(consumirVolverA()).toBeNull();
  });

  it('ignora una ruta vencida', () => {
    localStorage.setItem('sc-volver-a', JSON.stringify({ ruta: '/asociarme', hasta: Date.now() - 1 }));
    expect(consumirVolverA()).toBeNull();
  });

  it('solo acepta rutas internas', () => {
    localStorage.setItem('sc-volver-a', JSON.stringify({ ruta: '//otro-sitio.com', hasta: Date.now() + 1000 }));
    expect(consumirVolverA()).toBeNull();
    localStorage.setItem('sc-volver-a', JSON.stringify({ ruta: 'https://otro.com', hasta: Date.now() + 1000 }));
    expect(consumirVolverA()).toBeNull();
  });

  it('no falla si el almacenamiento no está disponible o tiene basura', () => {
    localStorage.setItem('sc-volver-a', '{no es json');
    expect(consumirVolverA()).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => recordarVolverA('/x')).not.toThrow();
  });
});
