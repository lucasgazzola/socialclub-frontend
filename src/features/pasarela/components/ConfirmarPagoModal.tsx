import type { ReactNode } from 'react';
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { Button, Modal, ModalActions, Spinner } from '@/components/ui';

interface ConfirmarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Qué se paga, en una línea (ej. «Períodos a pagar (2)»). */
  titulo: string;
  /** Detalle de lo que se paga (períodos, entradas…). */
  detalle: ReactNode;
  total: number;
  onConfirmar: () => void;
  isLoading: boolean;
}

/**
 * TASK-51 · Paso previo a la pasarela: resume qué se paga y redirige a pagar.
 * Los datos de la tarjeta se cargan en Mercado Pago, nunca en SocialClub.
 */
export function ConfirmarPagoModal({
  isOpen,
  onClose,
  titulo,
  detalle,
  total,
  onConfirmar,
  isLoading,
}: ConfirmarPagoModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      icon={<Lock />}
      title="Confirmar pago"
      description="Vas a completar el pago en Mercado Pago. Al terminar, volvés a SocialClub."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-1 text-xs font-medium text-slate-500">{titulo}</div>
          <div className="text-sm font-semibold text-slate-800">{detalle}</div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-sm font-bold text-slate-700">Monto total</span>
            <span className="text-lg font-extrabold text-brand-700">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>
            Pago seguro: los datos de tu tarjeta los cargás en la página de Mercado Pago, no en
            SocialClub. Tenés 30 minutos para completarlo.
          </span>
        </div>

        <ModalActions>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={isLoading} data-testid="pagar-ir-a-pasarela">
            {isLoading ? <Spinner className="h-4 w-4" /> : <ExternalLink size={16} />}
            {isLoading ? 'Redirigiendo…' : 'Ir a pagar'}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
}
