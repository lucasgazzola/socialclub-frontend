import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Pencil, UserMinus, UserPlus } from 'lucide-react';
import { Badge, Button, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { isoADisplay } from '@/lib/utils/fecha';
import { useActivarParticipante } from '../hooks/useActivarParticipante';
import { useDarDeBajaParticipante } from '../hooks/useDarDeBajaParticipante';
import { EstadoHabilitacionBadge } from '@/features/documentacion/components/EstadoBadges';
import type { ParticipanteConDisciplinas } from '../types';

interface ParticipantesTableProps {
  participantes: ParticipanteConDisciplinas[];
  /** DT-11: abre la documentación del participante (solo si se puede gestionar). */
  onVerDocumentacion?: (participante: ParticipanteConDisciplinas) => void;
  /** TASK-31: inscribir a este participante en otra disciplina. */
  onInscribir?: (participante: ParticipanteConDisciplinas) => void;
}

/** Etiqueta del estado de una inscripción puntual del participante. */
function etiquetaEstadoDisciplina(activo: boolean, estado?: string) {
  const esActivo = estado ? estado === 'INSCRIPTO' : activo;
  return { texto: esActivo ? 'Inscripto' : 'Baja', activo: esActivo };
}

function BadgeEstado({ activo, texto }: { activo: boolean; texto: string }) {
  return (
    <Badge variant={activo ? 'success' : 'secondary'}>
      {texto}
    </Badge>
  );
}

/** Badge del estado propio del participante (US-07: Activo/Inactivo). */
function BadgeParticipante({ activo }: { activo: boolean }) {
  return (
    <Badge variant={activo ? 'success' : 'secondary'}>
      {activo ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}

/**
 * US-08 — Listado de participantes: una fila por participante y, al
 * expandirla, todas las disciplinas en las que está inscripto.
 * US-07 — Desde acá el delegado (o un admin) puede dar de baja al
 * participante: la baja alcanza a todas sus disciplinas.
 */
export function ParticipantesTable({ participantes, onVerDocumentacion, onInscribir }: ParticipantesTableProps) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [participanteAConfirmar, setParticipanteAConfirmar] =
    useState<ParticipanteConDisciplinas | null>(null);
  const [participanteAReactivar, setParticipanteAReactivar] =
    useState<ParticipanteConDisciplinas | null>(null);
  const { mutateAsync: darDeBaja, isPending: dandoDeBaja } = useDarDeBajaParticipante();
  const { mutateAsync: activar, isPending: activando } = useActivarParticipante();

  // El backend además valida el rol: acá sólo se oculta lo que no corresponde.
  const puedeDarDeBaja =
    usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'DELEGADO') ?? false;

  const confirmarBaja = async () => {
    const participante = participanteAConfirmar;
    if (!participante) {
      return;
    }

    try {
      await darDeBaja(participante.personaId);
      setParticipanteAConfirmar(null);
    } catch {
      // El hook ya avisa del error con un toast; el diálogo queda abierto
      // para poder reintentar.
    }
  };

  const confirmarReactivacion = async () => {
    const participante = participanteAReactivar;
    if (!participante) {
      return;
    }

    try {
      await activar(participante.personaId);
      setParticipanteAReactivar(null);
    } catch {
      // El hook ya avisa del error con un toast; el diálogo queda abierto
      // para poder reintentar.
    }
  };

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
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Apellido y nombre</th>
              <th className="px-5 py-3.5">DNI</th>
              <th className="px-5 py-3.5">Disciplinas</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Documentación</th>
              <th className="px-5 py-3.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
        <tbody className="divide-y divide-slate-100">
          {participantes.map((participante) => {
            const expandido = expandidos.has(participante.personaId);
            return (
              <ParticipanteRow
                key={participante.personaId}
                participante={participante}
                expandido={expandido}
                puedeDarDeBaja={puedeDarDeBaja}
                onToggle={() => toggleExpandido(participante.personaId)}
                onDarDeBaja={() => setParticipanteAConfirmar(participante)}
                onReactivar={() => setParticipanteAReactivar(participante)}
                onVerDocumentacion={onVerDocumentacion ? () => onVerDocumentacion(participante) : undefined}
                onInscribir={onInscribir ? () => onInscribir(participante) : undefined}
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

      <ConfirmDialog
        open={participanteAConfirmar !== null}
        variant="danger"
        title="Dar de baja al participante"
        description={
          participanteAConfirmar
            ? `${participanteAConfirmar.persona.apellido}, ${participanteAConfirmar.persona.nombre} no va a poder participar de ninguna disciplina.`
            : undefined
        }
        confirmLabel="Dar de baja"
        loading={dandoDeBaja}
        onConfirm={() => void confirmarBaja()}
        onCancel={() => setParticipanteAConfirmar(null)}
      >
        {participanteAConfirmar ? (
          <p className="text-sm text-slate-600">
            Se desactiva su estado (pasa a Inactivo), se dan de baja sus{' '}
            {participanteAConfirmar.disciplinas.filter((d) => d.activo).length} disciplina(s)
            vigente(s) y no se le van a generar nuevas cuotas. Podés reactivarlo más adelante.
          </p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={participanteAReactivar !== null}
        variant="success"
        title="Reactivar al participante"
        description={
          participanteAReactivar
            ? `${participanteAReactivar.persona.apellido}, ${participanteAReactivar.persona.nombre} va a poder inscribirse de nuevo.`
            : undefined
        }
        confirmLabel="Reactivar"
        loading={activando}
        onConfirm={() => void confirmarReactivacion()}
        onCancel={() => setParticipanteAReactivar(null)}
      >
        {participanteAReactivar ? (
          <p className="text-sm text-slate-600">
            Su estado pasa a Activo. Las disciplinas no se re-inscriben solas: cada inscripción
            se hace por separado.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

interface ParticipanteRowProps {
  participante: ParticipanteConDisciplinas;
  expandido: boolean;
  puedeDarDeBaja: boolean;
  onToggle: () => void;
  onDarDeBaja: () => void;
  onReactivar: () => void;
  onEditar: () => void;
  onVerDocumentacion?: () => void;
  onInscribir?: () => void;
}

function ParticipanteRow({
  participante,
  expandido,
  puedeDarDeBaja,
  onToggle,
  onDarDeBaja,
  onReactivar,
  onEditar,
  onVerDocumentacion,
  onInscribir,
}: ParticipanteRowProps) {
  const nombres = participante.disciplinas.map((d) => d.disciplina.nombre);
  const visibles = nombres.slice(0, 2);
  const restantes = nombres.length - visibles.length;

  return (
    <>
      <tr className="transition-colors hover:bg-slate-50/70">
        <td className="px-5 py-3.5 font-medium text-slate-900">
          {participante.persona.apellido}, {participante.persona.nombre}
        </td>
        <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600">{participante.persona.dni}</td>
        <td className="px-5 py-3.5 text-slate-600">
          {nombres.length === 0 ? '—' : visibles.join(', ')}
          {restantes > 0 && <span className="ml-1 text-xs text-slate-400">+{restantes} más</span>}
        </td>
        <td className="px-5 py-3.5">
          <BadgeParticipante activo={participante.persona.activo} />
        </td>
        <td className="px-5 py-3.5">
          {participante.estadoDocumental ? (
            <EstadoHabilitacionBadge estado={participante.estadoDocumental} />
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-5 py-3.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
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
            {onInscribir && participante.persona.activo && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Inscribir a ${participante.persona.apellido}, ${participante.persona.nombre} en otra disciplina`}
                onClick={onInscribir}
              >
                <UserPlus size={14} />
                Inscribir
              </Button>
            )}
            {onVerDocumentacion && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Documentación de ${participante.persona.apellido}, ${participante.persona.nombre}`}
                onClick={onVerDocumentacion}
              >
                <FileText size={14} />
                Documentación
              </Button>
            )}
            {puedeDarDeBaja && participante.persona.activo && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                aria-label={`Dar de baja a ${participante.persona.apellido}, ${participante.persona.nombre}`}
                onClick={onDarDeBaja}
              >
                <UserMinus size={14} />
                Dar de baja
              </Button>
            )}
            {puedeDarDeBaja && !participante.persona.activo && (
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                aria-label={`Reactivar a ${participante.persona.apellido}, ${participante.persona.nombre}`}
                onClick={onReactivar}
              >
                <CheckCircle2 size={14} />
                Reactivar
              </Button>
            )}
          </div>
        </td>
      </tr>
      {expandido && (
        <tr className="bg-slate-50/60">
          <td colSpan={6} className="px-4 py-3">
            <div className="rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="text-xs tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 font-medium">Disciplina</th>
                    <th className="px-4 py-2 font-medium">Categoría</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium">Documentación</th>
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
                        <td className="px-4 py-2">
                          {d.estadoDocumental ? (
                            <div>
                              <EstadoHabilitacionBadge estado={d.estadoDocumental} />
                              {d.motivosDocumentacion && d.motivosDocumentacion.length > 0 && (
                                <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                                  {d.motivosDocumentacion.map((m) => (
                                    <li key={m}>{m}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {isoADisplay(d.fechaInscripcion)}
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
