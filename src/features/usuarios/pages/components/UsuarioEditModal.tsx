import { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { UsuarioForm } from '../../components/UsuarioForm';
import type { Usuario } from '../../types';
import { Modal } from './Modal';
import type { UsuarioEditFormValues } from '../../schemas/usuario.schema';

interface UsuarioEditModalProps {
  open: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onSave: (payload: UsuarioEditFormValues) => Promise<void>;
}

export function UsuarioEditModal({ open, usuario, onClose, onSave }: UsuarioEditModalProps) {
  const rolesTexto = useMemo(
    () => usuario?.roles.map((rol) => rol.rol.nombre).join(', ') ?? '',
    [usuario],
  );

  async function handleSubmit(values: UsuarioEditFormValues) {
    if (!usuario) {
      return;
    }

    await onSave(values);
    onClose();
  }

  return (
    <Modal
      open={open && !!usuario}
      title="Editar usuario"
      description="Actualizá los datos básicos y los roles desde este panel."
      onClose={onClose}
      className="max-w-3xl"
    >
      {usuario ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <BadgeCheck size={16} />
              {usuario.activo ? 'Usuario activo' : 'Usuario deshabilitado'}
            </div>
            <p className="mt-1 text-emerald-700">
              DNI: {usuario.dni ?? 'Sin dato'} · Roles: {rolesTexto || 'Sin roles'}
            </p>
          </div>

          <UsuarioForm
            modo="editar"
            usuarioInicial={usuario}
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