import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';
import { Button, Card, ConfirmDialog, Spinner, StatusTabs, Input, Select } from '@/components/ui';
import { useActivateUsuario } from '../hooks/useActivateUsuario';
import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { useDeactivateUsuario } from '../hooks/useDeactivateUsuario';
import { useUpdateUsuario } from '../hooks/useUpdateUsuario';
import { useUsers } from '../hooks/useUsers';
import { UsuariosGrid } from '../components/UsuariosGrid';
import type { CreateUsuarioDto, Usuario, UpdateUsuarioDto } from '../types';
import { UsuarioFormModal } from './components/UsuarioFormModal';
import {
  disciplinasIdsParaApi,
  type UsuarioCreateFormValues,
  type UsuarioEditFormValues,
} from '../schemas/usuario.schema';

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

  /** Usuario cuyo cambio de estado está esperando confirmación (DT-04). */
  const [usuarioAConfirmar, setUsuarioAConfirmar] = useState<Usuario | null>(null);

  const POR_PAGINA = 10;
  const [pagina, setPagina] = useState(1);
  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rolId, setRolId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const trimmed = textoInput.trim();
    if (trimmed === busqueda) return;
    const timer = setTimeout(() => {
      setPagina(1);
      setBusqueda(trimmed);
      setUsuarioDestacadoId(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoInput, busqueda]);

  const { data, isLoading, isError, error } = useUsers({
    busqueda: busqueda || undefined,
    rolId,
    estado: filtroEstado,
    pagina,
    porPagina: POR_PAGINA,
  });
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deactivateUsuario = useDeactivateUsuario();
  const activateUsuario = useActivateUsuario();

  const cambioDeEstadoEnCurso = deactivateUsuario.isPending || activateUsuario.isPending;

  const usuarios: Usuario[] = Array.isArray(data) ? data : (data?.items ?? []);
  const totalPaginas = data && !Array.isArray(data) && data.porPagina ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const totalUsuarios = data && !Array.isArray(data) ? data.total : usuarios.length;
  const hayResultados = usuarios.length > 0;

  const totalActivos = usuarios.filter((usuario) => usuario.activo).length;
  const totalInactivos = usuarios.length - totalActivos;
  const counts = data && !Array.isArray(data) && data.counts
    ? data.counts
    : {
        todos: usuarios.length,
        activos: totalActivos,
        inactivos: totalInactivos,
      };

  const usuariosVisibles = useMemo(() => {
    // Si la data viene en array plano (ej: tests unitarios con useUsers mockeado sin backend)
    const filtrados =
      (!data || Array.isArray(data)) && filtroEstado !== 'todos'
        ? usuarios.filter((usuario) => {
            if (filtroEstado === 'activos') return usuario.activo;
            if (filtroEstado === 'inactivos') return !usuario.activo;
            return true;
          })
        : usuarios;

    const destacado = filtrados.find((usuario) => usuario.id === usuarioDestacadoId);
    if (!destacado) {
      return filtrados;
    }

    return [destacado, ...filtrados.filter((usuario) => usuario.id !== destacado.id)];
  }, [usuarios, filtroEstado, data, usuarioDestacadoId]);

  function cambiarFiltro(valor: FiltroEstado) {
    setPagina(1);
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
    const datos = values as UsuarioCreateFormValues;
    const payload: CreateUsuarioDto = { ...datos, disciplinasIds: disciplinasIdsParaApi(datos) };
    await createUsuario.mutateAsync(payload);
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
      disciplinasIds: disciplinasIdsParaApi(values),
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

  /**
   * Alterna el estado del usuario: da de baja si está activo, lo reactiva si
   * no. La confirmación la pide el ConfirmDialog, no window.confirm (DT-04).
   */
  async function aplicarCambioEstado() {
    const usuario = usuarioAConfirmar;
    if (!usuario) {
      return;
    }

    if (usuario.activo) {
      await deactivateUsuario.mutateAsync(usuario.id);
    } else {
      await activateUsuario.mutateAsync(usuario.id);
    }

    setUsuarioAConfirmar(null);
    setUsuarioDestacadoId(usuario.id);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Creá y editá usuarios de gestión.</p>
        </div>

        <Button onClick={abrirCreacion} className="self-start shadow-xs sm:self-auto">
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

      <ConfirmDialog
        open={usuarioAConfirmar !== null}
        variant={usuarioAConfirmar?.activo ? 'danger' : 'success'}
        title={usuarioAConfirmar?.activo ? 'Desactivar usuario' : 'Habilitar usuario'}
        description={
          usuarioAConfirmar?.activo
            ? `${usuarioAConfirmar.nombre} ${usuarioAConfirmar.apellido} no va a poder iniciar sesión. Podés volver a habilitarlo cuando quieras.`
            : usuarioAConfirmar
              ? `${usuarioAConfirmar.nombre} ${usuarioAConfirmar.apellido} va a poder iniciar sesión de nuevo.`
              : undefined
        }
        confirmLabel={usuarioAConfirmar?.activo ? 'Desactivar' : 'Habilitar'}
        loading={cambioDeEstadoEnCurso}
        onConfirm={() => void aplicarCambioEstado()}
        onCancel={() => setUsuarioAConfirmar(null)}
      />

      <div className="space-y-3">
        <div>
          <StatusTabs<FiltroEstado>
            value={filtroEstado}
            onChange={cambiarFiltro}
            tabs={[
              { value: 'todos', label: 'Todos', count: counts.todos },
              { value: 'activos', label: 'Activos', count: counts.activos },
              { value: 'inactivos', label: 'Inactivos', count: counts.inactivos },
            ]}
          />

          {/* Accesibilidad y compatibilidad con pruebas automatizadas */}
          <select
            id="filtroEstado"
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => cambiarFiltro(e.target.value as FiltroEstado)}
            className="sr-only"
            tabIndex={-1}
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              id="busqueda"
              autoComplete="off"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              leftIcon={<Search />}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Select
              id="rolId"
              value={rolId ?? ''}
              onChange={(e) => {
                setPagina(1);
                setRolId(e.target.value ? Number(e.target.value) : undefined);
                setUsuarioDestacadoId(null);
              }}
              leftIcon={<Filter />}
              className="w-full sm:w-52"
            >
              <option value="">Todos los roles</option>
              <option value="1">Administrador</option>
              <option value="2">Colaborador</option>
            </Select>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.'}
        </div>
      ) : usuariosVisibles.length === 0 ? (
        <Card className="p-6 text-sm text-slate-500">
          {busqueda || rolId !== undefined || filtroEstado !== 'todos' || usuarios.length > 0
            ? 'Ningún usuario coincide con el filtro seleccionado.'
            : 'No hay usuarios cargados todavía.'}
        </Card>
      ) : (
        <>
          <UsuariosGrid
            usuarios={usuariosVisibles}
            usuarioDestacadoId={usuarioDestacadoId}
            accionesDeshabilitadas={cambioDeEstadoEnCurso}
            onEditar={abrirEdicion}
            onCambiarEstado={setUsuarioAConfirmar}
          />

          {hayResultados && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{totalUsuarios} usuario(s)</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {pagina} de {totalPaginas}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
