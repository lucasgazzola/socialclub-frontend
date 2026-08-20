import { useEffect, useState } from 'react';
import { listarDisciplinasActivas } from '../api/disciplina.api';
import type { DisciplinaOption } from '../types';

export function useDisciplinasActivas() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    listarDisciplinasActivas()
      .then((data) => {
        if (!cancelado) setDisciplinas(data);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las disciplinas.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return { disciplinas, cargando, error };
}