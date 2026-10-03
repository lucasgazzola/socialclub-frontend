import { UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Modal, Spinner } from '@/components/ui';
import { SocioForm } from './SocioForm';
import { useEditarSocio, useSocio } from '../hooks/useSocios';
import { socioToFormData } from '../types';

interface EditarSocioModalProps {
  /** Socio a editar; null cierra el modal. */
  socioId: number | null;
  onClose: () => void;
}

/** US-13 — Editar socio, en modal (DT-20: antes era una página aparte). */
export function EditarSocioModal({ socioId, onClose }: EditarSocioModalProps) {
  const id = socioId ?? 0;
  const { data: socio, isLoading } = useSocio(id);
  const { mutateAsync } = useEditarSocio(id);

  const handleSubmit = async (data: Parameters<typeof mutateAsync>[0]) => {
    await mutateAsync(data);
    toast.success('Socio actualizado correctamente');
    onClose();
  };

  return (
    <Modal
      open={socioId !== null}
      onClose={onClose}
      size="lg"
      icon={<UserCog />}
      title="Editar socio"
      description={socio ? `${socio.apellido}, ${socio.nombre}` : undefined}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !socio ? (
        <p className="text-sm text-rose-700">El socio no existe.</p>
      ) : (
        <SocioForm
          key={socio.id}
          defaultValues={socioToFormData(socio)}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Guardar cambios"
        />
      )}
    </Modal>
  );
}
