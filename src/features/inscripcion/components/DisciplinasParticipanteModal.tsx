import { useNavigate } from 'react-router-dom';
import { Calendar, Dumbbell, Pencil } from 'lucide-react';
import { Badge, Button, Modal, ModalActions } from '@/components/ui';
import { EstadoHabilitacionBadge } from '@/features/documentacion/components/EstadoBadges';
import { formatearDni } from '@/lib/utils/dni';
import { isoADisplay } from '@/lib/utils/fecha';
import { ROUTES } from '@/routes/paths';
import type { ParticipanteConDisciplinas } from '../types';

interface DisciplinasParticipanteModalProps {
  participante: ParticipanteConDisciplinas | null;
  onClose: () => void;
}

export function DisciplinasParticipanteModal({
  participante,
  onClose,
}: DisciplinasParticipanteModalProps) {
  const navigate = useNavigate();

  const esInscripto = participante?.estado === 'INSCRIPTO';
  const activas = participante?.disciplinas.filter((d) => d.activo === true) ?? [];
  const bajas = participante?.disciplinas.filter((d) => d.activo === false) ?? [];

  return (
    <Modal
      open={participante !== null}
      onClose={onClose}
      size="lg"
      className="sm:max-w-3xl"
      icon={<Dumbbell size={20} />}
      title={
        participante
          ? `Disciplinas de ${participante.persona.apellido}, ${participante.persona.nombre}`
          : 'Disciplinas'
      }
      description={
        participante ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs tabular-nums">
              DNI {formatearDni(participante.persona.dni)}
            </span>
            <Badge variant={esInscripto ? 'success' : 'secondary'}>
              {esInscripto ? 'Activo' : 'Baja'}
            </Badge>
          </span>
        ) : undefined
      }
    >
      {participante && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Disciplinas activas ({activas.length})
            </h3>

            {activas.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No tiene disciplinas activas
              </div>
            ) : (
              <div className="space-y-3">
                {activas.map((d) => (
                  <div
                    key={d.inscripcionId}
                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <Dumbbell size={16} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{d.disciplina.nombre}</p>
                          {d.categoriaDisciplina && (
                            <span className="mt-0.5 inline-flex rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                              {d.categoriaDisciplina.nombre}
                            </span>
                          )}
                        </div>
                      </div>
                      {d.estadoDocumental && (
                        <EstadoHabilitacionBadge estado={d.estadoDocumental} />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={13} />
                      <span>Inscripto el {isoADisplay(d.fechaInscripcion)}</span>
                    </div>

                    {d.motivosDocumentacion && d.motivosDocumentacion.length > 0 && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <p className="mb-1 font-medium text-slate-700">Observaciones documentales:</p>
                        <ul className="list-disc space-y-0.5 pl-4">
                          {d.motivosDocumentacion.map((motivo) => (
                            <li key={motivo}>{motivo}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {bajas.length > 0 && (
            <section className="space-y-3 border-t border-slate-200 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Historial (Bajas) ({bajas.length})
              </h3>
              <div className="space-y-2.5">
                {bajas.map((d) => (
                  <div
                    key={d.inscripcionId}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-sm text-slate-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{d.disciplina.nombre}</span>
                        {d.categoriaDisciplina && (
                          <span className="inline-flex rounded-md bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {d.categoriaDisciplina.nombre}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary">Baja</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Inscripción: {isoADisplay(d.fechaInscripcion)}</span>
                      {d.fechaBaja && <span>Baja: {isoADisplay(d.fechaBaja)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.editarParticipante(participante.personaId));
              }}
            >
              <Pencil size={14} />
              Editar participante
            </Button>
          </ModalActions>
        </div>
      )}
    </Modal>
  );
}
