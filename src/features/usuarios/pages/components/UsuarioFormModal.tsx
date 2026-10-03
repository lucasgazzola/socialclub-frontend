import { BadgeCheck, BadgeAlertIcon, UserPlus, Edit3 } from 'lucide-react';
import { Modal } from '@/components/ui';
import { UsuarioForm } from '../../components/UsuarioForm';
import type { Usuario } from '../../types';
import type {
  UsuarioCreateFormValues,
  UsuarioEditFormValues,
} from '../../schemas/usuario.schema';

interface UsuarioFormModalProps {
  open: boolean;
  /** 'crear' muestra el formulario en blanco; 'editar' lo precarga con `usuario`. */
  modo: 'crear' | 'editar';
  /** Usuario a editar. Ignorado (puede ser null) cuando modo === 'crear'. */
  usuario: Usuario | null;
  onClose: () => void;
  onSubmit: (values: UsuarioCreateFormValues | UsuarioEditFormValues) => Promise<void>;
}

export function UsuarioFormModal({ open, modo, usuario, onClose, onSubmit }: UsuarioFormModalProps) {
  const esEdicion = modo === 'editar';

  async function handleSubmit(values: UsuarioCreateFormValues | UsuarioEditFormValues) {
    await onSubmit(values);
    onClose();
  }

  // En edición esperamos a tener el usuario cargado antes de mostrar el modal
  // (evita un parpadeo con el formulario vacío); en creación no hace falta.
  const abierto = open && (!esEdicion || !!usuario);

  return (
    <Modal
      open={abierto}
      title={esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
      icon={esEdicion ? <Edit3 /> : <UserPlus />}
      description={
        esEdicion
          ? 'Actualizá los datos básicos y los roles desde este panel.'
          : 'Completá los datos básicos y asigná los roles correspondientes.'
      }
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        {esEdicion && usuario ? (
          <div
            className={
              usuario.activo
                ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                : "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            }
          >
            <div className="flex items-center gap-2 font-medium">
              {usuario.activo ? <BadgeCheck size={16} /> : <BadgeAlertIcon size={16} />}
              {usuario.activo ? 'Usuario activo' : 'Usuario inactivo'}
            </div>
          </div>
        ) : null}
        
        <UsuarioForm
          key={esEdicion ? (usuario?.id ?? 'editar') : 'crear'}
          modo={modo}
          usuarioInicial={esEdicion ? usuario : null}
          mostrarPasswordField={!esEdicion}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />

      </div>
    </Modal>
  );
}
