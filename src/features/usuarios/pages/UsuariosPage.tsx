import { useState } from 'react';
import { BadgeAlertIcon, BadgeCheck, Edit3, UserPlus, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { useActivateUsuario } from '../hooks/useActivateUsuario';
import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { useDeactivateUsuario } from '../hooks/useDeactivateUsuario';
import { useUpdateUsuario } from '../hooks/useUpdateUsuario';
import { useUsers } from '../hooks/useUsers';
import type { CreateUsuarioDto, Usuario, UpdateUsuarioDto } from '../types';
import { UsuarioFormModal } from './components/UsuarioFormModal';
import type { UsuarioCreateFormValues, UsuarioEditFormValues } from '../schemas/usuario.schema';

export function UsuariosPage() {
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar'>('crear');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data: usuarios = [], isLoading, isError, error } = useUsers();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deactivateUsuario = useDeactivateUsuario();
  const activateUsuario = useActivateUsuario();

  function abrirCreacion() {
    setUsuarioSeleccionado(null);
    setModoFormulario('crear');
    setModalAbierto(true);
  }

  function abrirEdicion(usuario: Usuario) {
    setUsuarioSeleccionado(usuario);
    setModoFormulario('editar');
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setUsuarioSeleccionado(null);
  }

  async function handleCreate(values: UsuarioCreateFormValues | UsuarioEditFormValues) {
    await createUsuario.mutateAsync(values as CreateUsuarioDto);
  }

  async function handleUpdate(values: UsuarioCreateFormValues | UsuarioEditFormValues) {
    if (!usuarioSeleccionado) {
      return;
    }

    const resto = Object.fromEntries(
      Object.entries(values as UsuarioEditFormValues & { password?: string }).filter(
        ([key]) => key !== 'password',
      ),
    ) as UpdateUsuarioDto;

    const payload: UpdateUsuarioDto = {
      ...resto,
    };

    await updateUsuario.mutateAsync({ id: usuarioSeleccionado.id, payload });
  }

  async function handleSubmit(values: UsuarioCreateFormValues | UsuarioEditFormValues) {
    if (modoFormulario === 'editar') {
      await handleUpdate(values);
      return;
    }

    await handleCreate(values);
  }

  /** Alterna el estado del usuario: da de baja si está activo, lo reactiva si no. */
  async function confirmarCambioEstado(usuario: Usuario) {
    if (usuario.activo) {
      const confirmado = window.confirm(
        `¿Desactivar a ${usuario.nombre} ${usuario.apellido}? Podés volver a activarlo cuando quieras.`,
      );
      if (!confirmado) {
        return;
      }
      await deactivateUsuario.mutateAsync(usuario.id);
    } else {
      const confirmado = window.confirm(
        `¿Habilitar nuevamente a ${usuario.nombre} ${usuario.apellido}?`,
      );
      if (!confirmado) {
        return;
      }
      await activateUsuario.mutateAsync(usuario.id);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Usuarios administrativos</h1>
          <p className="mt-1 text-sm text-slate-500">Creá y editá usuarios de gestión.</p>
        </div>

        <Button onClick={abrirCreacion}>
          <UserPlus size={16} />
          Nuevo usuario
        </Button>
      </header>

      <UsuarioFormModal
        open={modalAbierto}
        modo={modoFormulario}
        usuario={usuarioSeleccionado}
        onClose={cerrarModal}
        onSubmit={handleSubmit}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.'}
        </div>
      ) : usuarios.length === 0 ? (
        <Card className="p-6 text-sm text-slate-500">No hay usuarios cargados todavía.</Card>
      ) : (
        <div className="grid gap-4">
          {usuarios.map((usuario) => {
            const roles = usuario.roles.map((rol) => rol.rol.nombre).join(', ');

            return (
              <Card key={usuario.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          usuario.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-500'
                        }`}
                      >
                        {usuario.activo ? <BadgeCheck size={12} /> : <BadgeAlertIcon size={12} />}
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{usuario.email}</p>
                    <p className="text-sm text-slate-500">
                      DNI: {usuario.dni ?? 'Sin dato'} · Roles: {roles || 'Sin roles'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => abrirEdicion(usuario)}>
                      <Edit3 size={16} />
                      Editar
                    </Button>
                    <Button
                      variant={usuario.activo ? 'danger' : 'success'}
                      size="sm"
                      disabled={deactivateUsuario.isPending || activateUsuario.isPending}
                      onClick={() => void confirmarCambioEstado(usuario)}
                    >
                      {usuario.activo ? <UserRoundX size={18} /> : <UserRoundCheck size={18} />}
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
