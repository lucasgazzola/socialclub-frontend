import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

interface ModalConfirmarBajaSocioProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isPending?: boolean;
}

/**
 * US-42: Modal de confirmación para solicitar la baja como socio.
 */
export function ModalConfirmarBajaSocio({
  open,
  onClose,
  onConfirm,
  isPending = false,
}: ModalConfirmarBajaSocioProps) {
  return (
    <Modal
      open={open}
      onClose={isPending ? () => {} : onClose}
      title="Confirmar baja como socio"
      size="sm"
      icon={<AlertTriangle />}
      tone="danger"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={() => void onConfirm()} disabled={isPending}>
            {isPending ? 'Procesando baja…' : 'Sí, confirmar baja'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">¿Estás seguro de que querés darte de baja?</p>
            <p className="text-amber-800">
              Al confirmar, tu membresía pasará al estado <strong className="font-semibold">Inactivo</strong>. Perderás el acceso a los servicios y beneficios exclusivos para socios del club.
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-xs text-slate-600 rounded-lg bg-slate-50 p-3 border border-slate-200">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            Tus datos e historial de pagos y cuotas se conservarán inalterados.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            Mantendrás tu usuario activo y podrás solicitar re-asociarte en cualquier momento.
          </li>
        </ul>
      </div>
    </Modal>
  );
}
