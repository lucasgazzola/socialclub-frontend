import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Select } from '@/components/ui';
import type { InscripcionFormValues } from '../schemas/inscripcion.schema';
import { categoriasDisponibles, type DisciplinaOption } from '../../disciplinas/types';

import type { GeneroDisciplina } from '../../disciplinas/types';

interface DisciplinaCategoriaSelectorProps {
  control: Control<InscripcionFormValues>;
  errors: FieldErrors<InscripcionFormValues>;
  disciplinas: DisciplinaOption[];
  disciplinaSeleccionada: DisciplinaOption | undefined;
  participante?: { fechaNacimiento?: string | null; genero?: GeneroDisciplina | null };
}

export function DisciplinaCategoriaSelector({
  control,
  errors,
  disciplinas,
  disciplinaSeleccionada,
  participante,
}: DisciplinaCategoriaSelectorProps) {
  const categorias = categoriasDisponibles(disciplinaSeleccionada, undefined, participante);
  const tieneCategorias = (disciplinaSeleccionada?.categorias ?? []).length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="disciplinaId" className="mb-1 block text-sm font-medium text-slate-700">Disciplina</label>
        <Controller
          control={control}
          name="disciplinaId"
          render={({ field }) => (
            <Select
              id="disciplinaId"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Seleccioná una disciplina</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          )}
        />
        {errors.disciplinaId && (
          <p className="mt-1 text-xs text-red-600">{errors.disciplinaId.message}</p>
        )}
      </div>

      {tieneCategorias && (
        <div>
          <label htmlFor="categoriaDisciplinaId" className="mb-1 block text-sm font-medium text-slate-700">Categoría</label>
          <Controller
            control={control}
            name="categoriaDisciplinaId"
            render={({ field }) => (
              <Select
                id="categoriaDisciplinaId"
                value={field.value ?? ''}
                disabled={categorias.length === 0}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">
                  {categorias.length === 0
                    ? 'No hay categorías que cumplan edad/género'
                    : 'Seleccioná una categoría'}
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            )}
          />
          {errors.categoriaDisciplinaId && (
            <p className="mt-1 text-xs text-red-600">{errors.categoriaDisciplinaId.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
