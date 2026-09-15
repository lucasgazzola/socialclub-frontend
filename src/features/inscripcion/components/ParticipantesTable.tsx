import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import type { Inscripcion } from '../types';

interface ParticipantesTableProps {
  participantes: Inscripcion[];
}

/** Traduce el estado de la inscripción a la etiqueta que ve el usuario (US-08). */
function etiquetaEstado(inscripcion: Inscripcion) {
  const activo = inscripcion.estado ? inscripcion.estado === 'INSCRIPTO' : inscripcion.activo;
  return { texto: activo ? 'Inscripto' : 'Baja', activo };
}

export function ParticipantesTable({ participantes }: ParticipantesTableProps) {
  const navigate = useNavigate();

  if (participantes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No se encontraron resultados
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Apellido y nombre</th>
            <th className="px-4 py-3 font-medium">DNI</th>
            <th className="px-4 py-3 font-medium">Disciplina</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {participantes.map((participante) => {
            const estado = etiquetaEstado(participante);
            return (
              <tr key={participante.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900">
                  {participante.persona.apellido}, {participante.persona.nombre}
                </td>
                <td className="px-4 py-3 text-slate-600">{participante.persona.dni}</td>
                <td className="px-4 py-3 text-slate-600">{participante.disciplina.nombre}</td>
                <td className="px-4 py-3 text-slate-600">
                  {participante.categoriaDisciplina?.nombre ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      estado.activo
                        ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                    }
                  >
                    {estado.texto}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(
                        ROUTES.participantesEditar.replace(':id', String(participante.personaId)),
                      )
                    }
                  >
                    <Pencil size={14} />
                    Editar
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
