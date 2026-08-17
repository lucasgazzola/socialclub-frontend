import { useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Edit3, Plus, Power } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { UserForm } from '../components/UserForm';
import { useCreateUser } from '../hooks/useCreateUser';
import { useDeactivateUser } from '../hooks/useDeactivateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { useUsers } from '../hooks/useUsers';
import type { CreateUserDto, User, UpdateUserDto } from '../types';
import { UserEditModal } from './components/UserEditModal';
import type { UserCreateFormValues, UserEditFormValues } from '../schemas/user.schema';

export function UsersPage() {
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar' | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<User | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: usuarios = [], isLoading, isError, error } = useUsers();
  const createUsuario = useCreateUser();
  const updateUsuario = useUpdateUser();
  const deactivateUsuario = useDeactivateUser();

  const formularioVisible = modoFormulario !== null;
  const tituloFormulario = useMemo(
    () => (modoFormulario === 'editar' ? 'Editar usuario' : 'Nuevo usuario'),
    [modoFormulario],
  );

  function abrirCreacion() {
    setUsuarioSeleccionado(null);
    setModoFormulario((actual) => (actual === 'crear' ? null : 'crear'));
  }

  function abrirEdicion(user: User) {
    setUsuarioEditando(user);
    setEditModalOpen(true);
  }

  function cerrarFormulario() {
    setModoFormulario(null);
    setUsuarioSeleccionado(null);
  }

  function cerrarEdicion() {
    setEditModalOpen(false);
    setUsuarioEditando(null);
  }

  async function handleCreate(values: UserCreateFormValues | UserEditFormValues) {
    await createUsuario.mutateAsync(values as CreateUserDto);
    cerrarFormulario();
  }

  async function handleUpdate(values: UserEditFormValues) {
    if (!usuarioEditando) {
      return;
    }

    const { password: _password, ...resto } = values as UserEditFormValues & {
      password?: string;
    };

    const payload: UpdateUserDto = {
      ...resto,
    };

    await updateUsuario.mutateAsync({ id: usuarioEditando.id, payload });
    cerrarEdicion();
  }

  async function handleSubmit(values: UserCreateFormValues | UserEditFormValues) {
    if (modoFormulario === 'editar') {
      await handleUpdate(values);
      return;
    }

    await handleCreate(values);
  }

  async function confirmarBaja(user: User) {
    const confirmado = window.confirm(
      `¿Deshabilitar a ${user.name} ${user.lastName}? Esta acción se puede revertir más adelante desde la base de datos.`,
    );

    if (!confirmado) {
      return;
    }

    await deactivateUsuario.mutateAsync(user.id);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Usuarios administrativos</h1>
          <p className="mt-1 text-sm text-slate-500">Creá, editá y deshabilitá usuarios de gestión.</p>
        </div>

        <Button onClick={abrirCreacion}>
          <Plus size={16} />
          {formularioVisible && modoFormulario === 'crear' ? 'Cerrar formulario' : 'Nuevo usuario'}
        </Button>
      </header>

      {formularioVisible && (
        <Card className="p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{tituloFormulario}</h2>
              <p className="text-sm text-slate-500">
                Completá los datos básicos y asigná los roles correspondientes.
              </p>
            </div>
            <Button variant="ghost" onClick={cerrarFormulario}>
              Cancelar
            </Button>
          </div>

          <UserForm
            modo={modoFormulario}
            usuarioInicial={usuarioSeleccionado}
            onSubmit={handleSubmit}
          />
        </Card>
      )}

      <UserEditModal
        open={editModalOpen}
        user={usuarioEditando}
        onClose={cerrarEdicion}
        onSave={handleUpdate}
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
          {usuarios.map((user) => {
            const roles = user.roles.map((rol) => rol.role.name).join(', ');

            return (
              <Card key={user.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {user.name} {user.lastName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.active ? <BadgeCheck size={12} /> : <AlertCircle size={12} />}
                        {user.active ? 'Activo' : 'Deshabilitado'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-sm text-slate-500">
                      DNI: {user.dni ?? 'Sin dato'} · Roles: {roles || 'Sin roles'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => abrirEdicion(user)}>
                      <Edit3 size={16} />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={!user.active || deactivateUsuario.isPending}
                      onClick={() => void confirmarBaja(user)}
                    >
                      <Power size={16} />
                      Deshabilitar
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