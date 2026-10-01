import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { mockPagoSchema, type MockPagoFormData } from '@/features/pagos/schemas/pago.schema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cantidad: number;
  precioUnitario: number;
  onConfirmPago: (data: MockPagoFormData) => Promise<void>;
  isLoading: boolean;
}

export function MockPasarelaEntradasModal({
  isOpen,
  onClose,
  cantidad,
  precioUnitario,
  onConfirmPago,
  isLoading,
}: Props) {
  const total = cantidad * precioUnitario;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MockPagoFormData>({
    resolver: zodResolver(mockPagoSchema),
    defaultValues: { titular: '', numeroTarjeta: '', vencimiento: '', cvc: '' },
  });

  const formatoImporte = total.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Pasarela de pago (simulación)"
      description="Ingresá los datos de tu tarjeta. No se realizarán cargos reales."
    >
      <form onSubmit={(event) => void handleSubmit(onConfirmPago)(event)} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{cantidad} entrada(s)</span>
            <span>${formatoImporte}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>${formatoImporte}</span>
          </div>
        </div>
        <Input
          label="Nombre del titular"
          placeholder="ej: juan perez"
          error={errors.titular?.message}
          {...register('titular')}
        />
        <Input
          label="Número de tarjeta"
          placeholder="4500 0000 0000 0000"
          maxLength={19}
          error={errors.numeroTarjeta?.message}
          {...register('numeroTarjeta', {
            onChange: (event) => {
              const valor = event.target.value
                .replace(/\D/g, '')
                .slice(0, 16)
                .replace(/(\d{4})(?=\d)/g, '$1 ');
              setValue('numeroTarjeta', valor, { shouldValidate: true });
            },
          })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Vencimiento"
            placeholder="mm/aa"
            maxLength={5}
            error={errors.vencimiento?.message}
            {...register('vencimiento')}
          />
          <Input
            label="Código CVC"
            placeholder="123"
            type="password"
            maxLength={4}
            error={errors.cvc?.message}
            {...register('cvc')}
          />
        </div>
        <div className="flex items-center gap-2 rounded-md bg-slate-100 p-2.5 text-xs text-slate-500">
          <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
          <span>Simulador seguro sandbox.</span>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Lock size={16} />
            {isLoading ? 'Procesando…' : `Confirmar y pagar $${formatoImporte}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
