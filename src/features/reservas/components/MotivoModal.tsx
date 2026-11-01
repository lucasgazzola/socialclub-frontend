import { useEffect, useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { Button, Modal, ModalActions } from '@/components/ui';

interface MotivoModalProps {
  open: boolean;
  titulo: string;
  descripcion: string;
  etiquetaConfirmar: string;
  isLoading: boolean;
  onConfirmar: (motivo: string) => void;
  onClose: () => void;
}

/** US-60 / US-61: pide el motivo obligatorio de un rechazo o de una cancelación del club. */
export function MotivoModal({
  open,
  titulo,
  descripcion,
  etiquetaConfirmar,
  isLoading,
  onConfirmar,
  onClose,
}: MotivoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMotivo('');
      setError(null);
    }
  }, [open]);

  const confirmar = () => {
    const texto = motivo.trim();
    if (texto.length < 5) {
      setError('El motivo es obligatorio (al menos 5 caracteres).');
      return;
    }
    onConfirmar(texto);
  };

  return (
    <Modal
      open={open}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      tone="danger"
      icon={<MessageSquareWarning />}
      title={titulo}
      description={descripcion}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="motivo-reserva" className="block text-sm font-medium text-slate-700">
            Motivo *
          </label>
          <textarea
            id="motivo-reserva"
            rows={3}
            maxLength={500}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ej: El salón está reservado para la fiesta aniversario del club."
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          <p className="mt-1 text-xs text-slate-500">Se le envía al solicitante por email.</p>
        </div>
        <ModalActions>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Volver
          </Button>
          <Button variant="danger" onClick={confirmar} disabled={isLoading}>
            {etiquetaConfirmar}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
}
