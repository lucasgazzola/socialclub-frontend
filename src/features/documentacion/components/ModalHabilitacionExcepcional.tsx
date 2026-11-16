import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button, Input, Modal, ModalActions } from '@/components/ui';
import { useHabilitarExcepcional } from '../hooks/useDocumentacion';

interface ModalHabilitacionExcepcionalProps {
  open: boolean;
  onClose: () => void;
  inscripcionId: number;
  personaId: number;
  participanteNombre: string;
  disciplinaNombre: string;
  categoriaNombre?: string | null;
  motivos?: string[];
}

function calcularFechaLimite(diasNum: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasNum);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * US-28 — Modal para levantar manualmente el bloqueo de documentación
 * de una inscripción (exclusivo para usuarios con rol ADMIN).
 */
export function ModalHabilitacionExcepcional({
  open,
  onClose,
  inscripcionId,
  personaId,
  participanteNombre,
  disciplinaNombre,
  categoriaNombre,
  motivos = [],
}: ModalHabilitacionExcepcionalProps) {
  const [motivo, setMotivo] = useState('');
  const [dias, setDias] = useState<number | string>(15);
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [errorDias, setErrorDias] = useState<string | null>(null);

  const habilitar = useHabilitarExcepcional(personaId);

  const diasNumero = Number(dias);
  const diasValidos = !isNaN(diasNumero) && diasNumero >= 1;
  const fechaCalculada = diasValidos ? calcularFechaLimite(diasNumero) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hayError = false;
    const motivoTrim = motivo.trim();

    if (!motivoTrim) {
      setErrorMotivo('El motivo escrito es obligatorio para habilitar excepcionalmente la participación.');
      hayError = true;
    } else if (motivoTrim.length < 5) {
      setErrorMotivo('El motivo debe tener al menos 5 caracteres.');
      hayError = true;
    }

    if (!diasValidos) {
      setErrorDias('La cantidad de días debe ser un número entero mayor o igual a 1.');
      hayError = true;
    }

    if (hayError) return;

    try {
      await habilitar.mutateAsync({
        inscripcionId,
        payload: {
          motivo: motivoTrim,
          dias: diasNumero,
        },
      });
      onClose();
    } catch {
      // El hook ya muestra el toast con el mensaje de error.
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Habilitación excepcional de participación"
      description="Esta acción levanta temporalmente el bloqueo documental para casos puntuales justificados."
      tone="warning"
      icon={<ShieldAlert size={18} />}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Participante:</span> {participanteNombre}
          </p>
          <p className="mt-0.5">
            <span className="font-semibold text-slate-900">Actividad:</span> {disciplinaNombre}
            {categoriaNombre ? ` · ${categoriaNombre}` : ''}
          </p>
        </div>

        {motivos.length > 0 && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <p className="font-semibold">Motivo(s) del bloqueo a exceptuar:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {motivos.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="motivo-excepcion" className="block text-sm font-medium text-slate-700">
            Motivo de la excepción *
          </label>
          <textarea
            id="motivo-excepcion"
            rows={3}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (errorMotivo) setErrorMotivo(null);
            }}
            placeholder="Ej: Turno médico reprogramado por el especialista para el 25/10/2026..."
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {errorMotivo && <p className="mt-1 text-xs text-rose-600">{errorMotivo}</p>}
        </div>

        <div>
          <Input
            id="dias-excepcion"
            type="number"
            min={1}
            label="Cantidad de días de habilitación excepcional *"
            value={dias}
            onChange={(e) => {
              setDias(e.target.value);
              if (errorDias) setErrorDias(null);
            }}
            error={errorDias ?? undefined}
          />
          {diasValidos && !errorDias && (
            <p className="mt-1 text-xs text-slate-500">
              Habilitado excepcionalmente hasta el {fechaCalculada}
            </p>
          )}
        </div>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={habilitar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={habilitar.isPending}>
            {habilitar.isPending ? 'Habilitando…' : 'Confirmar habilitación'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

