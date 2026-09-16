import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button, Card, Select, Spinner } from '@/components/ui';
import { useActivateUsuario } from '../hooks/useActivateUsuario';
import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { useDeactivateUsuario } from '../hooks/useDeactivateUsuario';
import { useUpdateUsuario } from '../hooks/useUpdateUsuario';
import { useUsers } from '../hooks/useUsers';
import { UsuariosGrid } from '../components/UsuariosGrid';
import type { CreateUsuarioDto, Usuario, UpdateUsuarioDto } from '../types';
import { UsuarioFormModal } from './components/UsuarioFormModal';
import type { UsuarioCreateFormValues, UsuarioEditFormValues } from '../schemas/usuario.schema';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export function UsuariosPage() {
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar'>('crear');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  /**
   * Último usuario al que se le cambió el estado (DT-03). Se muestra primero y
   * resaltado para no perderlo de vista, porque el backend devuelve el listado
   * ordenado por apellido y la fila queda donde estaba. Es estado de la vista:
   * se limpia al cambiar el filtro o al recargar la pantalla.
   */
  const [usuarioDestacadoId, setUsuarioDestacadoId] = useState<number | null>(null);

  const { data: usuarios = [], isLoading, isError, error } = useUsers();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deactivateUsuario = useDeactivateUsuario();
  const activateUsuario = useActivateUsuario();

  const cambioDeEstadoEnCurso = deactivateUsuario.isPending || activateUsuario.isPending;

  const totalActivos = usuarios.filter((usuario) => usuario.activo).length;
  const totalInactivos = usuarios.length - totalActivos;

  const usuariosVisibles = useMemo(() => {
    const filtrados = usuarios.filter((usuario) => {
      if (filtroEstado === 'activos') return usuario.activo;
      if (filtroEstado === 'inactivos') return !usuario.activo;
      return true;
    });

    const destacado = filtrados.find((usuario) => usuario.id === usuarioDestacadoId);
    if (!destacado) {
      return filtrados;
    }

    return [destacado, ...filtrados.filter((usuario) => usuario.id !== destacado.id)];
  }, [usuarios, filtroEstado, usuarioDestacadoId]);

  function cambiarFiltro(valor: FiltroEstado) {
    setFiltroEstado(valor);
    setUsuarioDestacadoId(null);
  }

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

    setUsuarioDestacadoId(usuario.id);
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
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {usuarios.length} usuario(s) · {totalActivos} activo(s) · {totalInactivos}{' '}
              inactivo(s)
            </p>

            <Select
              id="filtroEstado"
              aria-label="Filtrar por estado"
              value={filtroEstado}
              onChange={(e) => cambiarFiltro(e.target.value as FiltroEstado)}
              className="min-w-[170px]"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
            </Select>
          </div>

          {usuariosVisibles.length === 0 ? (
            <Card className="p-6 text-sm text-slate-500">
              Ningún usuario coincide con el filtro seleccionado.
            </Card>
          ) : (
            <UsuariosGrid
              usuarios={usuariosVisibles}
              usuarioDestacadoId={usuarioDestacadoId}
              accionesDeshabilitadas={cambioDeEstadoEnCurso}
              onEditar={abrirEdicion}
              onCambiarEstado={(usuario) => void confirmarCambioEstado(usuario)}
            />
          )}
        </>
      )}
    </div>
  );
}
