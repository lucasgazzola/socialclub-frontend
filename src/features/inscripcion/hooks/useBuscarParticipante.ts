import { useCallback, useState } from 'react';
import { buscarParticipantePorDni } from '../api/inscripcion.api';
import type { ParticipanteEncontrado } from '../types';

interface EstadoBusqueda {
  cargando: boolean;
  participante: ParticipanteEncontrado | null;
  noEncontrado: boolean;
  error: string | null;
}

const ESTADO_INICIAL: EstadoBusqueda = {
  cargando: false,
  participante: null,
  noEncontrado: false,
  error: null,
};

export function useBuscarParticipante() {
  const [estado, setEstado] = useState<EstadoBusqueda>(ESTADO_INICIAL);

  const buscar = useCallback(async (dni: string) => {
    setEstado({ ...ESTADO_INICIAL, cargando: true });
    try {
      const participante = await buscarParticipantePorDni(dni);
      setEstado({ cargando: false, participante, noEncontrado: false, error: null });
      return { participante, noEncontrado: false };
    } catch (error: any) {
      const mensajeError = error?.message || '';
      const status = error?.response?.status || error?.status;

      if (status === 404 || mensajeError.includes('404') || mensajeError.includes('Cannot GET')) {
        setEstado({ cargando: false, participante: null, noEncontrado: true, error: null });
        return { participante: null, noEncontrado: true };
      }

      setEstado({
        cargando: false,
        participante: null,
        noEncontrado: false,
        error: 'No se pudo buscar el participante. Intentá de nuevo.',
      });
      return { participante: null, noEncontrado: false };
    }
  }, []);

  const limpiar = useCallback(() => setEstado(ESTADO_INICIAL), []);

  return { ...estado, buscar, limpiar };
}