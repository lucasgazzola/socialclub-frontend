import { describe, expect, it } from 'vitest';
import {
  DURACION_POR_DEFECTO_HORAS,
  getEstadoVisual,
  puedeComprar,
  formatPrecio,
  formatFechaEvento,
} from './helpers';
import type { Evento } from './types';

describe('features/eventos/helpers', () => {
  const baseEvento: Evento = {
    id: 1,
    nombre: 'Torneo de Pádel',
    descripcion: 'Pádel dobles',
    requiereEntrada: true,
    descuentoSocio: 0,
    capacidadMaxima: 100,
    entradasDisponibles: 50,
    precio: '1500',
    estado: 'PUBLICADO',
    fechaEvento: '2026-11-15T15:00:00.000Z',
    fechaFin: '2026-11-15T21:00:00.000Z',
    inicioVenta: '2026-09-01T00:00:00.000Z',
    finVenta: '2026-11-15T14:00:00.000Z',
    lugarAcreditacion: 'Canchas central',
    imageUrl: 'socialclub-frontend/src/assets/favicon-blanco.png',
  };

  describe('puedeComprar', () => {
    it('retorna true si estado es PUBLICADO, entradasDisponibles > 0 y capacidadMaxima > 0', () => {
      expect(puedeComprar(baseEvento)).toBe(true);
    });

    it('retorna false si el estado no es PUBLICADO', () => {
      expect(puedeComprar({ ...baseEvento, estado: 'BORRADOR' })).toBe(false);
      expect(puedeComprar({ ...baseEvento, estado: 'CANCELADO' })).toBe(false);
      expect(puedeComprar({ ...baseEvento, estado: 'FINALIZADO' })).toBe(false);
    });

    it('retorna false si entradasDisponibles es 0', () => {
      expect(puedeComprar({ ...baseEvento, entradasDisponibles: 0 })).toBe(false);
    });
  });

  describe('getEstadoVisual', () => {
    it('retorna CANCELADO si estado === CANCELADO', () => {
      const res = getEstadoVisual({ ...baseEvento, estado: 'CANCELADO' });
      expect(res.key).toBe('CANCELADO');
      expect(res.label).toBe('Cancelado');
      expect(res.opacidadChipEntradasReducida).toBe(true);
    });

    it('retorna FINALIZADO si estado === FINALIZADO o ahora > fechaFin', () => {
      const res1 = getEstadoVisual({ ...baseEvento, estado: 'FINALIZADO' });
      expect(res1.key).toBe('FINALIZADO');

      const ahoraDespues = new Date('2026-11-16T00:00:00Z');
      const res2 = getEstadoVisual(baseEvento, ahoraDespues);
      expect(res2.key).toBe('FINALIZADO');
    });

    it('retorna EN_CURSO si ahora está entre fechaEvento y fechaFin', () => {
      const ahoraEnCurso = new Date('2026-11-15T18:00:00Z');
      const res = getEstadoVisual(baseEvento, ahoraEnCurso);
      expect(res.key).toBe('EN_CURSO');
      expect(res.label).toBe('En curso');
      expect(res.opacidadChipEntradasReducida).toBe(false);
    });

    it('sin fechaFin, el evento dura 12 horas como en el backend (DT-33)', () => {
      const sinFin = { ...baseEvento, fechaFin: null };
      // 15:00 + 11 h: todavía en curso (las entradas siguen valiendo).
      expect(getEstadoVisual(sinFin, new Date('2026-11-16T02:00:00Z')).key).toBe('EN_CURSO');
      // 15:00 + 13 h: terminado.
      expect(getEstadoVisual(sinFin, new Date('2026-11-16T04:00:00Z')).key).toBe('FINALIZADO');
      expect(DURACION_POR_DEFECTO_HORAS).toBe(12);
    });

    it('retorna AGOTADO si entradasDisponibles === 0 o capacidadMaxima === 0', () => {
      const ahora = new Date('2026-10-01T00:00:00Z');
      const res = getEstadoVisual({ ...baseEvento, entradasDisponibles: 0 }, ahora);
      expect(res.key).toBe('AGOTADO');
      expect(res.label).toBe('Agotado');
      expect(res.opacidadChipEntradasReducida).toBe(true);
    });

    it('retorna VENTA_PROXIMA si ahora < inicioVenta', () => {
      const ahoraAntes = new Date('2026-08-01T00:00:00Z');
      const res = getEstadoVisual(baseEvento, ahoraAntes);
      expect(res.key).toBe('VENTA_PROXIMA');
      expect(res.label).toBe('Venta próxima');
    });

    it('retorna VENTA_CERRADA si ahora > finVenta', () => {
      const ahoraDespuesFinVenta = new Date('2026-11-15T14:30:00Z');
      const res = getEstadoVisual(baseEvento, ahoraDespuesFinVenta);
      expect(res.key).toBe('VENTA_CERRADA');
      expect(res.label).toBe('Venta cerrada');
    });

    it('retorna DISPONIBLE en caso contrario', () => {
      const ahoraNormal = new Date('2026-10-01T12:00:00Z');
      const res = getEstadoVisual(baseEvento, ahoraNormal);
      expect(res.key).toBe('DISPONIBLE');
      expect(res.label).toBe('Disponible');
    });
  });

  describe('formatPrecio', () => {
    it('formatea 0 como Gratis', () => {
      expect(formatPrecio(0)).toBe('Gratis');
      expect(formatPrecio('0')).toBe('Gratis');
    });

    it('formatea montos mayores a 0 en ARS', () => {
      const res = formatPrecio(1500);
      expect(res).toContain('1.500');
    });
  });

  describe('formatFechaEvento', () => {
    it('formatea fechas ISO a formato legible es-AR', () => {
      const str = formatFechaEvento('2026-10-12T18:00:00.000Z');
      expect(str).toContain('15:00 hs');
    });
  });
});
