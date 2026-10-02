import { describe, expect, it } from 'vitest';
import { categoriasDisponibles } from './types';

const futbol = {
  categorias: [
    { id: 1, nombre: 'Sub-15', activo: true },
    { id: 2, nombre: 'Reserva', activo: false },
  ],
};

describe('US-50 · categoriasDisponibles', () => {
  it('no ofrece categorías dadas de baja para nuevas inscripciones', () => {
    expect(categoriasDisponibles(futbol).map((c) => c.nombre)).toEqual(['Sub-15']);
  });

  it('conserva la categoría actual de la inscripción aunque esté dada de baja', () => {
    expect(categoriasDisponibles(futbol, 2).map((c) => c.nombre)).toEqual(['Sub-15', 'Reserva']);
  });

  it('devuelve una lista vacía si no hay disciplina seleccionada', () => {
    expect(categoriasDisponibles(undefined)).toEqual([]);
  });
});
