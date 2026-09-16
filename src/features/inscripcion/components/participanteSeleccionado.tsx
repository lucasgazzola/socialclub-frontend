import { useNavigate } from 'react-router-dom';
import { UserRound, X, Edit } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import type { ParticipanteEncontrado } from '../types';

interface ParticipanteSeleccionadoProps {
  participante: ParticipanteEncontrado;
  onCambiar: () => void;
}

export function ParticipanteSeleccionado({ participante, onCambiar }: ParticipanteSeleccionadoProps) {
  const navigate = useNavigate();

  const handleEditar = () => {
    // Participante sin disciplina no es "participante" aún → es Persona/Socio
    if (participante.inscripciones.length === 0) {
      navigate(ROUTES.sociosEditar.replace(':id', String(participante.id)));
      return;
    }
    navigate(`/participante/${participante.id}/editar`);
  };

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
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleEditar}>
          <Edit size={14} />
          Editar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCambiar}>
          <X size={14} />
          Cambiar
        </Button>
      </div>
    </Card>
  );
}