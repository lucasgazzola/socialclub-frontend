import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, Input } from '@/components/ui';
import { mockPagoSchema, type MockPagoFormData } from '../schemas/pago.schema';
import { Lock, ShieldCheck } from 'lucide-react';
import type { CuotaPendiente } from '../types';

interface MockPasarelaPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCuotas: CuotaPendiente[];
  onConfirmPago: (formData: MockPagoFormData) => Promise<void>;
  isLoading: boolean;
}

export function MockPasarelaPagoModal({
  isOpen,
  onClose,
  selectedCuotas,
  onConfirmPago,
  isLoading,
}: MockPasarelaPagoModalProps) {
  const total = selectedCuotas.reduce((sum, c) => sum + c.monto, 0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MockPagoFormData>({
    resolver: zodResolver(mockPagoSchema),
    defaultValues: {
      titular: '',
      numeroTarjeta: '',
      vencimiento: '',
      cvc: '',
    },
  });

  const handleVencimientoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setValue('vencimiento', val, { shouldValidate: true });
  };

  const handleNumeroTarjetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setValue('numeroTarjeta', val, { shouldValidate: true });
  };

  const onSubmit = async (data: MockPagoFormData) => {
    await onConfirmPago(data);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Pasarela de Pago (Simulación)"
      description="Ingresá los datos de tu tarjeta para procesar el pago de las cuotas seleccionadas."
    >
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        {/* Resumen del Pago */}
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
            <span>Períodos a pagar ({selectedCuotas.length})</span>
            <span>Subtotal</span>
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {selectedCuotas.map((c) => c.periodo).join(', ')}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Monto total</span>
            <span className="text-lg font-extrabold text-brand-700">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Inputs Tarjeta */}
        <div className="space-y-3">
          <Input
            label="Nombre del Titular"
            placeholder="Ej: JUAN PEREZ"
            error={errors.titular?.message}
            {...register('titular')}
          />

          <Input
            label="Número de Tarjeta"
            placeholder="4500 0000 0000 0000"
            maxLength={19}
            error={errors.numeroTarjeta?.message}
            {...register('numeroTarjeta', {
              onChange: handleNumeroTarjetaChange,
            })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vencimiento"
              placeholder="MM/AA"
              maxLength={5}
              error={errors.vencimiento?.message}
              {...register('vencimiento', {
                onChange: handleVencimientoChange,
              })}
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
        </div>

        {/* Notificación Mock Security */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-2.5 rounded-md">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>Simulador seguro sandbox — No se realizarán cargos reales a tu tarjeta.</span>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>

          <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
            <Lock size={16} />
            Confirmar y Pagar ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
