import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import type { ParticipanteConDisciplinas } from '../types';

interface ParticipantesTableProps {
  participantes: ParticipanteConDisciplinas[];
}

/** Etiqueta del estado agregado del participante (US-08). */
function etiquetaEstado(participante: ParticipanteConDisciplinas) {
  const activo = participante.estado === 'INSCRIPTO';
  return { texto: activo ? 'Inscripto' : 'Baja', activo };
}

/** Etiqueta del estado de una inscripción puntual del participante. */
function etiquetaEstadoDisciplina(activo: boolean, estado?: string) {
  const esActivo = estado ? estado === 'INSCRIPTO' : activo;
  return { texto: esActivo ? 'Inscripto' : 'Baja', activo: esActivo };
}

function BadgeEstado({ activo, texto }: { activo: boolean; texto: string }) {
  return (
    <span
      className={
        activo
          ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
          : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
      }
    >
      {texto}
    </span>
  );
}

/**
 * US-08 — Listado de participantes: una fila por participante y, al
 * expandirla, todas las disciplinas en las que está inscripto.
 */
export function ParticipantesTable({ participantes }: ParticipantesTableProps) {
  const navigate = useNavigate();
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  const toggleExpandido = (personaId: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(personaId)) {
        next.delete(personaId);
      } else {
        next.add(personaId);
      }
      return next;
    });
  };

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
            <th className="px-4 py-3 font-medium">Disciplinas</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {participantes.map((participante) => {
            const estado = etiquetaEstado(participante);
            const expandido = expandidos.has(participante.personaId);
            return (
              <ParticipanteRow
                key={participante.personaId}
                participante={participante}
                estado={estado}
                expandido={expandido}
                onToggle={() => toggleExpandido(participante.personaId)}
                onEditar={() =>
                  navigate(
                    ROUTES.participantesEditar.replace(':id', String(participante.personaId)),
                  )
                }
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface ParticipanteRowProps {
  participante: ParticipanteConDisciplinas;
  estado: { texto: string; activo: boolean };
  expandido: boolean;
  onToggle: () => void;
  onEditar: () => void;
}

function ParticipanteRow({
  participante,
  estado,
  expandido,
  onToggle,
  onEditar,
}: ParticipanteRowProps) {
  const nombres = participante.disciplinas.map((d) => d.disciplina.nombre);
  const visibles = nombres.slice(0, 2);
  const restantes = nombres.length - visibles.length;

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3 text-slate-900">
          {participante.persona.apellido}, {participante.persona.nombre}
        </td>
        <td className="px-4 py-3 text-slate-600">{participante.persona.dni}</td>
        <td className="px-4 py-3 text-slate-600">
          {nombres.length === 0 ? '—' : visibles.join(', ')}
          {restantes > 0 && <span className="ml-1 text-xs text-slate-400">+{restantes} más</span>}
        </td>
        <td className="px-4 py-3">
          <BadgeEstado activo={estado.activo} texto={estado.texto} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expandido}
              aria-label={`Ver disciplinas de ${participante.persona.apellido}, ${participante.persona.nombre}`}
              onClick={onToggle}
            >
              {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expandido ? 'Ocultar' : 'Ver disciplinas'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEditar}>
              <Pencil size={14} />
              Editar
            </Button>
          </div>
        </td>
      </tr>
      {expandido && (
        <tr className="bg-slate-50/60">
          <td colSpan={5} className="px-4 py-3">
            <div className="rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="text-xs tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 font-medium">Disciplina</th>
                    <th className="px-4 py-2 font-medium">Categoría</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium">Fecha de inscripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participante.disciplinas.map((d) => {
                    const estadoDisciplina = etiquetaEstadoDisciplina(d.activo, d.estado);
                    return (
                      <tr key={d.inscripcionId}>
                        <td className="px-4 py-2 text-slate-800">{d.disciplina.nombre}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {d.categoriaDisciplina?.nombre ?? '—'}
                        </td>
                        <td className="px-4 py-2">
                          <BadgeEstado
                            activo={estadoDisciplina.activo}
                            texto={estadoDisciplina.texto}
                          />
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {new Date(d.fechaInscripcion).toLocaleDateString('es-AR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
