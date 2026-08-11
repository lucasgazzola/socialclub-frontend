import { useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Edit3, Plus, Power } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { UsuarioForm } from '../components/UsuarioForm';
import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { useDeactivateUsuario } from '../hooks/useDeactivateUsuario';
import { useUpdateUsuario } from '../hooks/useUpdateUsuario';
import { useUsers } from '../hooks/useUsers';
import type { CreateUsuarioDto, Usuario, UpdateUsuarioDto } from '../types';
import { UsuarioEditModal } from './components/UsuarioEditModal';
import type { UsuarioCreateFormValues, UsuarioEditFormValues } from '../schemas/usuario.schema';

export function UsuariosPage() {
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar' | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: usuarios = [], isLoading, isError, error } = useUsers();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deactivateUsuario = useDeactivateUsuario();

  const formularioVisible = modoFormulario !== null;
  const tituloFormulario = useMemo(
    () => (modoFormulario === 'editar' ? 'Editar usuario' : 'Nuevo usuario'),
    [modoFormulario],
  );

  function abrirCreacion() {
    setUsuarioSeleccionado(null);
    setModoFormulario((actual) => (actual === 'crear' ? null : 'crear'));
  }

  function abrirEdicion(usuario: Usuario) {
    setUsuarioEditando(usuario);
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

  async function handleCreate(values: UsuarioCreateFormValues | UsuarioEditFormValues) {
    await createUsuario.mutateAsync(values as CreateUsuarioDto);
    cerrarFormulario();
  }

  async function handleUpdate(values: UsuarioEditFormValues) {
    if (!usuarioEditando) {
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

    await updateUsuario.mutateAsync({ id: usuarioEditando.id, payload });
    cerrarEdicion();
  }

  async function handleSubmit(values: UsuarioCreateFormValues | UsuarioEditFormValues) {
    if (modoFormulario === 'editar') {
      await handleUpdate(values);
      return;
    }

    await handleCreate(values);
  }

  async function confirmarBaja(usuario: Usuario) {
    const confirmado = window.confirm(
      `¿Deshabilitar a ${usuario.nombre} ${usuario.apellido}? Esta acción se puede revertir más adelante desde la base de datos.`,
    );

    if (!confirmado) {
      return;
    }

    await deactivateUsuario.mutateAsync(usuario.id);
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

          <UsuarioForm
            modo={modoFormulario}
            usuarioInicial={usuarioSeleccionado}
            onSubmit={handleSubmit}
          />
        </Card>
      )}

      <UsuarioEditModal
        open={editModalOpen}
        usuario={usuarioEditando}
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
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {usuario.activo ? <BadgeCheck size={12} /> : <AlertCircle size={12} />}
                        {usuario.activo ? 'Activo' : 'Deshabilitado'}
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
                      variant="danger"
                      size="sm"
                      disabled={!usuario.activo || deactivateUsuario.isPending}
                      onClick={() => void confirmarBaja(usuario)}
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