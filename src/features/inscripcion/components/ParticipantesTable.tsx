import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronDown, FileText, Pencil, UserMinus, UserPlus } from 'lucide-react';
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
                    ROUTES.editarParticipante(participante.personaId),
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

  const nombreCompleto = `${participante.persona.apellido}, ${participante.persona.nombre}`;
  const panelId = `disciplinas-${participante.personaId}`;

  return (
    <>
      <tr className={`transition-colors ${expandido ? 'bg-slate-50/80' : 'hover:bg-slate-50/70'}`}>
        <td className="px-5 py-3.5 font-medium text-slate-900">
          <div className="flex items-center gap-2">
            {/* Desplegar al lado del nombre: las acciones quedan siempre en el mismo lugar. */}
            <button
              type="button"
              aria-expanded={expandido}
              aria-controls={panelId}
              aria-label={`Ver disciplinas de ${nombreCompleto}`}
              title={expandido ? 'Ocultar disciplinas' : 'Ver disciplinas'}
              onClick={onToggle}
              className="-ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandido ? 'rotate-180 text-brand-600' : ''}`} />
            </button>
            <span>{nombreCompleto}</span>
          </div>
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
            <Button variant="ghost" size="sm" onClick={onEditar}>
              <Pencil size={14} />
              Editar
            </Button>
            {onInscribir && participante.persona.activo && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Inscribir a ${nombreCompleto} en otra disciplina`}
                onClick={onInscribir}
              >
                <UserPlus size={14} />
                Inscribir
              </Button>
            )}
            {onVerDocumentacion && (
              <Button variant="ghost" size="sm" aria-label={`Documentación de ${nombreCompleto}`} onClick={onVerDocumentacion}>
                <FileText size={14} />
                Documentación
              </Button>
            )}
            {puedeDarDeBaja && participante.persona.activo && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                aria-label={`Dar de baja a ${nombreCompleto}`}
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
                aria-label={`Reactivar a ${nombreCompleto}`}
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
        <tr id={panelId} className="bg-slate-50/80">
          <td colSpan={6} className="px-5 pb-4 pt-0">
            {participante.disciplinas.length === 0 ? (
              <p className="pl-8 text-sm text-slate-500">No tiene disciplinas.</p>
            ) : (
              // Una tarjeta por disciplina: no comparte columnas con la tabla, así que no hay nada que desalinear.
              <ul className="grid gap-3 pl-8 sm:grid-cols-2 xl:grid-cols-3">
                {participante.disciplinas.map((d) => {
                  const estadoDisciplina = etiquetaEstadoDisciplina(d.activo, d.estado);
                  return (
                    <li
                      key={d.inscripcionId}
                      className={`rounded-xl border bg-white p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] ${
                        estadoDisciplina.activo ? 'border-slate-200/80' : 'border-slate-200/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{d.disciplina.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {d.categoriaDisciplina ? `Categoría ${d.categoriaDisciplina.nombre}` : 'Sin categoría'}
                          </p>
                        </div>
                        <BadgeEstado activo={estadoDisciplina.activo} texto={estadoDisciplina.texto} />
                      </div>
                      <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-slate-500">Documentación</dt>
                          <dd>
                            {d.estadoDocumental ? (
                              <EstadoHabilitacionBadge estado={d.estadoDocumental} />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-slate-500">Inscripción</dt>
                          <dd className="text-slate-700">{isoADisplay(d.fechaInscripcion)}</dd>
                        </div>
                      </dl>
                      {d.motivosDocumentacion && d.motivosDocumentacion.length > 0 && (
                        <ul className="mt-3 space-y-1 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
                          {d.motivosDocumentacion.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
