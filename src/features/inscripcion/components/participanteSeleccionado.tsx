import { UserRound, X } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { ParticipanteEncontrado } from '../types';

interface ParticipanteSeleccionadoProps {
  participante: ParticipanteEncontrado;
  onCambiar: () => void;
}

/** Tarjeta que confirma al participante ya existente elegido en la búsqueda. */
export function ParticipanteSeleccionado({ participante, onCambiar }: ParticipanteSeleccionadoProps) {
  return (
    <Card className="flex items-start justify-between gap-4 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <UserRound size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {participante.nombre} {participante.apellido}
          </p>
          <p className="text-xs text-slate-500">DNI {participante.dni}</p>
          {participante.inscripciones.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Ya inscripto en:{' '}
              {participante.inscripciones
                .map(
                  (i) =>
                    i.disciplina.nombre +
                    (i.categoriaDisciplina ? ` (${i.categoriaDisciplina.nombre})` : ''),
                )
                .join(', ')}
            </p>
          )}
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onCambiar}>
        <X size={14} />
        Cambiar
      </Button>
    </Card>
  );
}