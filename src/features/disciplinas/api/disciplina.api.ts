import type { DisciplinaOption } from '../types';
import { listarDisciplinasActivasMock } from './disciplina.api.mock';

/**
 * ⚠️ MOCKEADO A PROPÓSITO: el backend real (GET /disciplinas) todavía no
 * está integrado en el AppModule. Esta función devuelve datos de prueba
 * directamente, sin pegarle a la API.
 *
 * Nadie más en el feature tiene que cambiar nada cuando esto se resuelva:
 * useDisciplinasActivas ya llama a esta misma función, así que alcanza con
 * reemplazar el cuerpo de acá por el fetch real (dejado comentado abajo).
 */
export async function listarDisciplinasActivas(): Promise<DisciplinaOption[]> {
  return listarDisciplinasActivasMock();
}