import { Pencil } from 'lucide-react';
import { Modal, Spinner } from '@/components/ui';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { CuotaSocialForm } from './CuotaSocialForm';
import { useActualizarCuotaSocial } from '../hooks/useActualizarCuotaSocial';
import { useCuotaSocialById } from '../hooks/useCuotaSocialById';
import type { CuotaSocialFormValues } from '../schemas';

interface EditarCuotaSocialModalProps {
  /** Configuración a editar; null cierra el modal. */
  cuotaId: number | null;
  onClose: () => void;
}

/** US-16 — Editar el monto de una cuota social, en modal (DT-20). */
export function EditarCuotaSocialModal({ cuotaId, onClose }: EditarCuotaSocialModalProps) {
  const { data: categorias = [] } = useCategorias();
  const { data: cuota, isLoading } = useCuotaSocialById(cuotaId ?? 0);
  const actualizarCuota = useActualizarCuotaSocial();

  async function handleSubmit(values: CuotaSocialFormValues) {
    if (!cuota) return;
    await actualizarCuota.mutateAsync({ id: cuota.id, payload: { monto: values.monto } });
    onClose();
  }

  return (
    <Modal
      open={cuotaId !== null}
      onClose={onClose}
      size="md"
      icon={<Pencil />}
      title="Editar cuota social"
      description={cuota ? `${cuota.categoria.nombre} · Período ${cuota.periodoAplicacion}` : undefined}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !cuota ? (
        <p className="text-sm text-rose-700">La configuración de cuota social no existe.</p>
      ) : (
        <CuotaSocialForm
          key={cuota.id}
          modo="editar"
          configuracionInicial={cuota}
          categorias={categorias}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
