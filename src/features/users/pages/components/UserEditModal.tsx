import { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { UserForm } from '../../components/UserForm';
import type { User } from '../../types';
import { Modal } from './Modal';
import type { UserEditFormValues } from '../../schemas/user.schema';

interface UsuarioEditModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (payload: UserEditFormValues) => Promise<void>;
}

export function UserEditModal({ open, user, onClose, onSave }: UsuarioEditModalProps) {
  const rolesTexto = useMemo(
    () => user?.roles.map((rol) => rol.role.name).join(', ') ?? '',
    [user],
  );

  async function handleSubmit(values: UserEditFormValues) {
    if (!user) {
      return;
    }

    await onSave(values);
    onClose();
  }

  return (
    <Modal
      open={open && !!user}
      title="Editar usuario"
      description="Actualizá los datos básicos y los roles desde este panel."
      onClose={onClose}
      className="max-w-3xl"
    >
      {user ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <BadgeCheck size={16} />
              {user.active ? 'User activo' : 'Usuario deshabilitado'}
            </div>
            <p className="mt-1 text-emerald-700">
              DNI: {user.dni ?? 'Sin dato'} · Roles: {rolesTexto || 'Sin roles'}
            </p>
          </div>

          <UserForm
            modo="editar"
            usuarioInicial={user}
            mostrarPasswordField={false}
            onSubmit={handleSubmit}
          />

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}