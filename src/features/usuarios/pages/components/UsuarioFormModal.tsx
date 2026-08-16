import { BadgeCheck, BadgeAlertIcon, UserPlus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui';
import { UsuarioForm } from '../../components/UsuarioForm';
import type { Usuario } from '../../types';
import { Modal } from './Modal';
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
      title={
        <div className="flex items-center gap-2">
          {esEdicion ? <Edit3 size={18} /> : <UserPlus size={18} />}
          <span>{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</span>
        </div>
      }
      description={
        esEdicion
          ? 'Actualizá los datos básicos y los roles desde este panel.'
          : 'Completá los datos básicos y asigná los roles correspondientes.'
      }
      onClose={onClose}
      className="max-w-3xl"
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
        />

        <div className="border-t border-slate-200 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            className="w-full border-2"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
