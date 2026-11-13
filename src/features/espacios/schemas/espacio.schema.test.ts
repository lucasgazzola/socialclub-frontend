import { describe, it, expect } from 'vitest';
import {
  espacioSchema,
  bloqueoFormSchema,
  normalizarEspacioPayload,
  normalizarBloqueoPayload,
} from './espacio.schema';

describe('US-55 · espacioSchema y bloqueoFormSchema', () => {
  const baseValido = {
    nombre: 'Cancha de Pádel 1',
    tipo: 'DEPORTIVO' as const,
    capacidadMaxima: 4,
    modalidad: 'POR_HORA' as const,
    ubicacion: 'Sector Norte',
    descripcion: 'Césped sintético y blindex',
    precio: 12000,
    descuentoSocio: 25,
    precioSocio: 9000,
    montoSena: 4000,
    disciplinaIds: [1],
    bloqueos: [],
  };

  it('valida correctamente un espacio válido con sus valores económicos (> 0)', () => {
    const res = espacioSchema.safeParse(baseValido);
    expect(res.success).toBe(true);
  });

  it('rechaza campos obligatorios vacíos o valores <= 0 (Criterio 6)', () => {
    const res = espacioSchema.safeParse({
      ...baseValido,
      nombre: '   ',
      capacidadMaxima: 0,
      precio: -500,
      montoSena: 0,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      const mensajes = res.error.issues.map((i) => i.message);
      expect(mensajes).toContain('El nombre del espacio es obligatorio');
      expect(mensajes).toContain('La capacidad máxima debe ser mayor a cero');
      expect(mensajes).toContain('El precio de alquiler debe ser mayor a cero');
      expect(mensajes).toContain('El monto de la seña debe ser mayor a cero');
    }
  });

  it('rechaza si el monto de la seña supera al precio de alquiler', () => {
    const res = espacioSchema.safeParse({
      ...baseValido,
      precio: 10000,
      montoSena: 15000,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/seña requerida no puede ser superior/i);
    }
  });

  it('valida bloqueo recurrente exigiendo días de la semana, franja horaria coherente y vigencia (Criterio 3)', () => {
    const invalido = bloqueoFormSchema.safeParse({
      tipo: 'RECURRENTE',
      diasSemana: [],
      horaInicio: '20:00',
      horaFin: '18:00',
      vigenteHasta: '',
    });

    expect(invalido.success).toBe(false);
    if (!invalido.success) {
      const paths = invalido.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('diasSemana');
      expect(paths).toContain('horaFin');
      expect(paths).toContain('vigenteHasta');
    }

    const valido = bloqueoFormSchema.safeParse({
      tipo: 'RECURRENTE',
      diasSemana: [1, 3, 5],
      horaInicio: '18:00',
      horaFin: '20:00',
      vigenteHasta: '2026-12-31',
      disciplinaId: 1,
      motivo: 'Entrenamiento escuelita',
    });
    expect(valido.success).toBe(true);
  });

  it('valida bloqueo puntual exigiendo fecha, motivo y franja horaria salvo que sea Día completo (Criterio 4)', () => {
    const sinMotivoNiFecha = bloqueoFormSchema.safeParse({
      tipo: 'PUNTUAL',
      fecha: '',
      diaCompleto: true,
      motivo: '   ',
    });

    expect(sinMotivoNiFecha.success).toBe(false);

    const diaCompletoValido = bloqueoFormSchema.safeParse({
      tipo: 'PUNTUAL',
      fecha: '2026-11-20',
      diaCompleto: true,
      motivo: 'Torneo Aniversario',
    });
    expect(diaCompletoValido.success).toBe(true);

    const normalizado = normalizarBloqueoPayload(diaCompletoValido.data!);
    expect(normalizado.horaInicio).toBeUndefined();
    expect(normalizado.horaFin).toBeUndefined();
    expect(normalizado.motivo).toBe('Torneo Aniversario');
  });

  it('normalizarEspacioPayload omite disciplinaIds si el tipo es SOCIAL (Criterio 2)', () => {
    const payload = normalizarEspacioPayload({
      ...baseValido,
      tipo: 'SOCIAL',
      disciplinaIds: [1, 2],
    });

    expect(payload.disciplinaIds).toBeUndefined();
  });

  it('Patrón Composite: normaliza correctamente sub-espacios en lote y personalizados', () => {
    const lotePayload = normalizarEspacioPayload({
      ...baseValido,
      nombre: 'Sector Parrillas Belgrano 245',
      tipo: 'SOCIAL',
      divisibleEnSubespacios: true,
      modoSubespacios: 'LOTE',
      cantidadSubespacios: 9,
      prefijoSubespacio: 'Parrilla',
      capacidadSubespacio: 10,
    });

    expect(lotePayload.cantidadSubespacios).toBe(9);
    expect(lotePayload.prefijoSubespacio).toBe('Parrilla');
    expect(lotePayload.capacidadSubespacio).toBe(10);
    expect(lotePayload.subespacios).toBeUndefined();

    const customPayload = normalizarEspacioPayload({
      ...baseValido,
      nombre: 'Complejo de Tenis',
      divisibleEnSubespacios: true,
      modoSubespacios: 'PERSONALIZADO',
      subespacios: [
        { nombre: 'Cancha Central Polvo de Ladrillo', capacidadMaxima: 4, descripcion: 'Techada' },
        { nombre: 'Cancha 2 Sintética', capacidadMaxima: 4 },
      ],
    });

    expect(customPayload.cantidadSubespacios).toBeUndefined();
    expect(customPayload.subespacios).toEqual([
      { nombre: 'Cancha Central Polvo de Ladrillo', capacidadMaxima: 4, descripcion: 'Techada' },
      { nombre: 'Cancha 2 Sintética', capacidadMaxima: 4 },
    ]);
  });
});
