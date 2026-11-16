import { useNavigate } from 'react-router-dom';
import { Dumbbell, FileText, Pencil, UserCheck, UserMinus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, ConfirmDialog, HeaderOrdenable } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { formatearDni } from '@/lib/utils/dni';
import { useDarDeBajaParticipante } from '../hooks/useDarDeBajaParticipante';
import { DarDeAltaParticipanteModal } from './DarDeAltaParticipanteModal';
import { DisciplinasParticipanteModal } from './DisciplinasParticipanteModal';
import { EstadoHabilitacionBadge } from '@/features/documentacion/components/EstadoBadges';
import type { ParticipanteConDisciplinas } from '../types';

interface ParticipantesTableProps {
  participantes: ParticipanteConDisciplinas[];
  ordenarPor?: string;
  orden?: 'asc' | 'desc';
  onOrdenar?: (campo: string) => void;
  /** DT-11: abre la documentación del participante (solo si se puede gestionar). */
  onVerDocumentacion?: (participante: ParticipanteConDisciplinas) => void;
  /** TASK-31: inscribir a este participante en otra disciplina. */
  onInscribir?: (participante: ParticipanteConDisciplinas) => void;
}

/** Badge del estado agregado del participante (Activo si está inscripto, Baja si no). */
function BadgeParticipante({ activo }: { activo: boolean }) {
  return (
    <Badge variant={activo ? 'success' : 'secondary'}>
      {activo ? 'Activo' : 'Baja'}
    </Badge>
  );
}

/**
 * US-08 — Listado de participantes: una fila por participante y, al
 * expandirla, todas las disciplinas en las que está inscripto.
 * US-07 — Desde acá el delegado (o un admin) puede dar de baja al
 * participante: la baja alcanza a todas sus disciplinas.
 */
export function ParticipantesTable({ participantes, ordenarPor, orden, onOrdenar, onVerDocumentacion }: ParticipantesTableProps) {
  const participantesOrdenados = useMemo(() => {
    if (!ordenarPor || !orden) return participantes;
    const copia = [...participantes];
    copia.sort((a, b) => {
      let comp: number;
      switch (ordenarPor) {
        case 'dni': {
          const dniA = Number(String(a.persona?.dni ?? '').replace(/\D/g, '')) || 0;
          const dniB = Number(String(b.persona?.dni ?? '').replace(/\D/g, '')) || 0;
          comp = dniA - dniB;
          break;
        }
        case 'disciplinas': {
          const cantA = a.cantidadDisciplinas ?? a.disciplinas?.length ?? 0;
          const cantB = b.cantidadDisciplinas ?? b.disciplinas?.length ?? 0;
          comp = cantA - cantB;
          break;
        }
        case 'estado': {
          const estA = a.estado === 'INSCRIPTO' ? 1 : 0;
          const estB = b.estado === 'INSCRIPTO' ? 1 : 0;
          comp = estA - estB;
          break;
        }
        case 'documentacion': {
          const docA = a.estadoDocumental ?? '';
          const docB = b.estadoDocumental ?? '';
          comp = docA.localeCompare(docB, 'es', { sensitivity: 'base' });
          break;
        }
        case 'nombre':
        default: {
          const nA = `${a.persona?.apellido} ${a.persona?.nombre}`.trim().toLowerCase();
          const nB = `${b.persona?.apellido} ${b.persona?.nombre}`.trim().toLowerCase();
          comp = nA.localeCompare(nB, 'es', { sensitivity: 'base' });
          break;
        }
      }
      return orden === 'asc' ? comp : -comp;
    });
    return copia;
  }, [participantes, ordenarPor, orden]);

  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [participanteDrawer, setParticipanteDrawer] =
    useState<ParticipanteConDisciplinas | null>(null);
  const [participanteAConfirmar, setParticipanteAConfirmar] =
    useState<ParticipanteConDisciplinas | null>(null);
  const [participanteADarDeAlta, setParticipanteADarDeAlta] =
    useState<ParticipanteConDisciplinas | null>(null);
  const { mutateAsync: darDeBaja, isPending: dandoDeBaja } = useDarDeBajaParticipante();

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
              <HeaderOrdenable
                campo="nombre"
                label="Apellido y nombre"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="dni"
                label="DNI"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="disciplinas"
                label="Disciplinas"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="estado"
                label="Estado"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="documentacion"
                label="Documentación"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <th className="px-5 py-3.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
        <tbody>
          {participantesOrdenados.map((participante) => (
            <ParticipanteRow
              key={participante.personaId}
              participante={participante}
              puedeDarDeBaja={puedeDarDeBaja}
              onVerDisciplinas={() => setParticipanteDrawer(participante)}
              onDarDeBaja={() => setParticipanteAConfirmar(participante)}
              onDarDeAlta={() => setParticipanteADarDeAlta(participante)}
              onVerDocumentacion={onVerDocumentacion ? () => onVerDocumentacion(participante) : undefined}
              onEditar={() =>
                navigate(
                  ROUTES.editarParticipante(participante.personaId),
                )
              }
            />
          ))}
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

      <DarDeAltaParticipanteModal
        participante={participanteADarDeAlta}
        onClose={() => setParticipanteADarDeAlta(null)}
      />

      <DisciplinasParticipanteModal
        participante={participanteDrawer}
        onClose={() => setParticipanteDrawer(null)}
      />
    </div>
  );
}

interface ParticipanteRowProps {
  participante: ParticipanteConDisciplinas;
  puedeDarDeBaja: boolean;
  onVerDisciplinas: () => void;
  onDarDeBaja: () => void;
  onDarDeAlta: () => void;
  onEditar: () => void;
  onVerDocumentacion?: () => void;
  onInscribir?: () => void;
}

function ParticipanteRow({
  participante,
  puedeDarDeBaja,
  onVerDisciplinas,
  onDarDeBaja,
  onDarDeAlta,
  onEditar,
  onVerDocumentacion,
}: Omit<ParticipanteRowProps, 'onInscribir'>) {
  const esInscripto = participante.estado === 'INSCRIPTO';
  const disciplinasActivas = participante.disciplinas.filter((d) => d.activo === true);
  const nombres = disciplinasActivas.map((d) => d.disciplina.nombre);
  const visibles = nombres.slice(0, 2);
  const restantes = nombres.length - visibles.length;

  return (
    <tr className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/70">
        <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
          {participante.persona.apellido}, {participante.persona.nombre}
        </td>
        <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600">{formatearDni(participante.persona.dni)}</td>
        <td className="px-5 py-3.5 text-slate-600">
          {nombres.length === 0 ? (
            <span className="text-slate-400">Sin disciplinas activas</span>
          ) : (
            <>
              {visibles.join(', ')}
              {restantes > 0 && <span className="ml-1 text-xs text-slate-400">+{restantes} más</span>}
            </>
          )}
        </td>
        <td className="px-5 py-3.5">
          <BadgeParticipante activo={esInscripto} />
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
              aria-label={`Ver disciplinas de ${participante.persona.apellido}, ${participante.persona.nombre}`}
              onClick={onVerDisciplinas}
              className="whitespace-nowrap"
            >
              <Dumbbell size={14} />
              Ver disciplinas
            </Button>
            <Button variant="ghost" size="sm" onClick={onEditar}>
              <Pencil size={14} />
              Editar
            </Button>
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
            {puedeDarDeBaja && esInscripto && (
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-rose-50 hover:text-rose-700"
                aria-label={`Dar de baja a ${participante.persona.apellido}, ${participante.persona.nombre}`}
                onClick={onDarDeBaja}
              >
                <UserMinus size={14} />
                Dar de baja
              </Button>
            )}
            {puedeDarDeBaja && !esInscripto && (
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-emerald-50 hover:text-emerald-700"
                aria-label={`Dar de alta a ${participante.persona.apellido}, ${participante.persona.nombre}`}
                onClick={onDarDeAlta}
              >
                <UserCheck size={14} />
                Dar de alta
              </Button>
            )}
          </div>
        </td>
      </tr>
  );
}
