import { useCallback, useState } from 'react';
import axios from 'axios';
import { crearInscripcion } from '../api/inscripcion.api';
import type { CrearInscripcionPayload, InscripcionCreada } from '../types';

export function useCrearInscripcion() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = useCallback(
    async (payload: CrearInscripcionPayload): Promise<InscripcionCreada | null> => {
      setEnviando(true);
      setError(null);
      try {
        return await crearInscripcion(payload);
      } catch (err) {
        let mensaje = 'No se pudo registrar la inscripción. Intentá de nuevo.';
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          const backendMessage = err.response.data.message;
          mensaje = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
        }
        setError(mensaje);
        return null;
      } finally {
        setEnviando(false);
      }
    },
    [],
  );

  return { enviar, enviando, error };
}