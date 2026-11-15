import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { entradasApi } from '../api/entradas.api';
import type { FiltrosMisEntradas, ValidarEntradaDto } from '../types';

/**
 * Organiza las keys de las queries para que sean consistentes y faciles de usar en los hooks.
 * Permite que la pantalla se mantenga sincronizada con el backend cuando cambian los datos.
 */
export const entradasKeys = {
  all: ['entradas'] as const,
  porEvento: (eventoId: number) => [...entradasKeys.all, 'por-evento', eventoId] as const,
  propias: (params?: FiltrosMisEntradas) => [...entradasKeys.all, 'propias', params] as const,
};

/**
 * Custom Hook (mutacion) para crear entradas. Se hace de esta forma para que al terminar
 * invalide las queries relevantes y de esta forma la UI se mantenga sincronizada con el backend.
 */
export function useCrearEntradas() {
  const qc = useQueryClient(); // Invalida queries despues de una mutacion, para que se refresquen los datos.
  return useMutation({
    // mutationFn es la funcion que llama a CrearEntradas para el evento especifico con su respectiva cantidad de entradas.
    mutationFn: ({ eventoId, cantidad }: { eventoId: number; cantidad: number }) =>
      entradasApi.crearEntradas(eventoId, cantidad),
    /** 
     * onSuccess es la funcion que se ejecuta despues de que la mutacion se completa exitosamente.
     * Asegura que la pantalla se actualice automaticamente con los datos nuevos, sin tener que hacer un fetch manual.
     */
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['eventos'] });
      qc.invalidateQueries({ queryKey: ['eventos', data.eventoId] });
      qc.invalidateQueries({ queryKey: entradasKeys.porEvento(data.eventoId) });
    },
  });
}

export function useEntradasPorEvento(eventoId: number) {
  return useQuery({
    queryKey: entradasKeys.porEvento(eventoId),
    queryFn: () => entradasApi.listarEntradasPorEvento(eventoId),
    enabled: !!eventoId,
  });
}

/**
 * US-52 · TASK-51: inicia la compra (reserva el cupo). La página redirige a
 * la pasarela; las entradas se generan cuando el pago se confirma.
 */
export function useIniciarCompraEntradas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: entradasApi.iniciarCompra,
    onSuccess: () => {
      // El cupo quedó reservado: cambian las disponibles del evento.
      void qc.invalidateQueries({ queryKey: ['eventos'] });
    },
  });
}

export function useMisEntradas(params?: FiltrosMisEntradas) {
  return useQuery({
    queryKey: entradasKeys.propias(params),
    queryFn: () => entradasApi.listarMisEntradas(params),
  });
}

export function useValidarEntrada() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ValidarEntradaDto) => entradasApi.validarEntrada(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: entradasKeys.all });
      if (data.entrada?.eventoId) {
        qc.invalidateQueries({ queryKey: ['eventos', data.entrada.eventoId] });
        qc.invalidateQueries({ queryKey: entradasKeys.porEvento(data.entrada.eventoId) });
      }
    },
  });
}
