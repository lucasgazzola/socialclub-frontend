import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button, Modal, ModalActions, Select } from '@/components/ui';
import { formatearPesos, type MetodoPagoSena, type SolicitudReserva } from '../types';

const METODOS: { value: MetodoPagoSena; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'OTRO', label: 'Otro' },
];

interface RegistrarSenaModalProps {
  reserva: SolicitudReserva | null;
  isLoading: boolean;
  onConfirmar: (metodoPago: MetodoPagoSena) => void;
  onClose: () => void;
}

/** US-60: secretaría registra el cobro de la seña y la reserva queda confirmada. */
export function RegistrarSenaModal({ reserva, isLoading, onConfirmar, onClose }: RegistrarSenaModalProps) {
  const [metodo, setMetodo] = useState<MetodoPagoSena>('EFECTIVO');

  return (
    <Modal
      open={!!reserva}
      onClose={isLoading ? () => {} : onClose}
      size="sm"
      tone="success"
      icon={<Wallet />}
      title="Registrar cobro de la seña"
      description={reserva ? `Reserva ${reserva.codigo} · ${reserva.espacio.nombre}` : undefined}
    >
      {reserva && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-sm font-medium text-slate-600">Seña a cobrar</span>
            <span className="text-lg font-bold text-brand-700">{formatearPesos(reserva.montoSena)}</span>
          </div>
          <label htmlFor="metodo-sena" className="block text-sm font-medium text-slate-700">
            Método de pago
          </label>
          <Select
            id="metodo-sena"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoPagoSena)}
          >
            {METODOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <ModalActions>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Volver
            </Button>
            <Button variant="success" onClick={() => onConfirmar(metodo)} disabled={isLoading}>
              Registrar y confirmar
            </Button>
          </ModalActions>
        </div>
      )}
    </Modal>
  );
}
