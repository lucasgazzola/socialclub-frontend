import { describe, expect, it } from 'vitest';
import type { Entrada } from '../types';
import { agruparPorEvento, claveEstadoEntrada, detalleEstadoEntrada } from './estadoEntrada';

const base = (extra: Partial<Entrada>, eventoExtra: Record<string, unknown> = {}) =>
  ({
    id: 1,
    token: 't',
    eventoId: 1,
    estado: 'VALIDA',
    creadoEn: '2026-11-01T00:00:00Z',
    ...extra,
    evento: { id: 1, nombre: 'Peña', estado: 'PUBLICADO', ...eventoExtra },
  }) as Entrada;

describe('TASK-60 · estado visible de una entrada', () => {
  it('distingue válida, usada, vencida y cancelada', () => {
    expect(claveEstadoEntrada(base({}))).toBe('VALIDA');
    expect(claveEstadoEntrada(base({ estado: 'USADA' }))).toBe('USADA');
    expect(claveEstadoEntrada(base({ estado: 'EXPIRADA' }))).toBe('VENCIDA');
    expect(claveEstadoEntrada(base({ estado: 'EXPIRADA' }, { estado: 'CANCELADO' }))).toBe('CANCELADA');
  });

  it('explica el estado (cuándo se usó o por qué venció)', () => {
    expect(detalleEstadoEntrada(base({ estado: 'USADA', usadaEn: '2026-11-12T22:40:00Z' }))).toMatch(/^Usada el /);
    expect(detalleEstadoEntrada(base({ estado: 'USADA', usadaEn: null }))).toBe('Ya se usó para ingresar');
    expect(detalleEstadoEntrada(base({ estado: 'EXPIRADA' }))).toBe('El evento ya terminó');
    expect(detalleEstadoEntrada(base({ estado: 'EXPIRADA' }, { estado: 'CANCELADO' }))).toBe('El evento fue cancelado');
  });

  it('agrupa por evento respetando el orden en que llegan', () => {
    const grupos = agruparPorEvento([
      base({ id: 1, eventoId: 5 }),
      base({ id: 2, eventoId: 3 }),
      base({ id: 3, eventoId: 5 }),
    ]);
    expect(grupos.map((g) => [g.eventoId, g.entradas.map((e) => e.id)])).toEqual([
      [5, [1, 3]],
      [3, [2]],
    ]);
  });
});
