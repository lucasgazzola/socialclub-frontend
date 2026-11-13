import { describe, it, expect } from 'vitest';
import {
  UMBRALES_MOROSIDAD,
  formatearFechaHoraEvento,
  formatearHoraActualizacion,
  formatearPorcentajeMorosos,
  obtenerSemaforoMorosidad,
} from './dashboard.utils';

describe('dashboard.utils', () => {
  describe('obtenerSemaforoMorosidad', () => {
    it('retorna nivel verde cuando el porcentaje es menor a 15%', () => {
      expect(UMBRALES_MOROSIDAD.AMARILLO_DESDE).toBe(15);
      expect(UMBRALES_MOROSIDAD.ROJO_DESDE).toBe(30);

      const res0 = obtenerSemaforoMorosidad(0);
      expect(res0.nivel).toBe('verde');
      expect(res0.varianteBadge).toBe('success');

      const res14 = obtenerSemaforoMorosidad(14.9);
      expect(res14.nivel).toBe('verde');
      expect(res14.varianteBadge).toBe('success');
    });

    it('retorna nivel amarillo cuando el porcentaje está entre 15% y 30% inclusive', () => {
      const res15 = obtenerSemaforoMorosidad(15);
      expect(res15.nivel).toBe('amarillo');
      expect(res15.varianteBadge).toBe('warning');

      const res30 = obtenerSemaforoMorosidad(30);
      expect(res30.nivel).toBe('amarillo');
      expect(res30.varianteBadge).toBe('warning');
    });

    it('retorna nivel rojo cuando el porcentaje es mayor a 30%', () => {
      const res31 = obtenerSemaforoMorosidad(30.1);
      expect(res31.nivel).toBe('rojo');
      expect(res31.varianteBadge).toBe('danger');
    });
  });

  describe('formatearPorcentajeMorosos', () => {
    it('formatea números siempre con un decimal', () => {
      expect(formatearPorcentajeMorosos(0)).toBe('0.0%');
      expect(formatearPorcentajeMorosos(12.5)).toBe('12.5%');
      expect(formatearPorcentajeMorosos(33.333)).toBe('33.3%');
      expect(formatearPorcentajeMorosos(Number.NaN)).toBe('0.0%');
    });
  });

  describe('formatearFechaHoraEvento', () => {
    it('formatea fecha ISO en DD/MM/YYYY HH:mm en zona horaria America/Argentina/Cordoba', () => {
      // 2026-11-20T21:30:00.000Z es 18:30 en Córdoba (UTC-3)
      expect(formatearFechaHoraEvento('2026-11-20T21:30:00.000Z')).toBe('20/11/2026 18:30');
    });

    it('retorna guion si el valor es nulo o inválido', () => {
      expect(formatearFechaHoraEvento(null)).toBe('—');
      expect(formatearFechaHoraEvento(undefined)).toBe('—');
      expect(formatearFechaHoraEvento('fecha-invalida')).toBe('—');
    });
  });

  describe('formatearHoraActualizacion', () => {
    it('formatea timestamp en HH:mm en zona horaria America/Argentina/Cordoba', () => {
      const ts = new Date('2026-11-08T17:05:00.000Z').getTime(); // 14:05 UTC-3
      expect(formatearHoraActualizacion(ts)).toBe('14:05');
    });

    it('retorna guion si el timestamp es 0 o indefinido', () => {
      expect(formatearHoraActualizacion(0)).toBe('—');
      expect(formatearHoraActualizacion(undefined)).toBe('—');
    });
  });
});
