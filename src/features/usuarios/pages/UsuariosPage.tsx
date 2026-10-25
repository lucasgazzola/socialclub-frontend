import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';
import { Button, Card, ConfirmDialog, Spinner, StatusTabs, Input, Select, TablePagination, TableExportMenu } from '@/components/ui';
import { usuariosApi } from '../api/usuarios.api';
import { formatearDni } from '@/lib/utils/dni';
import type { ExportColumn } from '@/lib/utils/exportTable';
import { useActivateUsuario } from '../hooks/useActivateUsuario';
import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { useDeactivateUsuario } from '../hooks/useDeactivateUsuario';
import { useUpdateUsuario } from '../hooks/useUpdateUsuario';
import { useUsers } from '../hooks/useUsers';
import { UsuariosGrid } from '../components/UsuariosGrid';
import type { CreateUsuarioDto, Usuario, UpdateUsuarioDto, CriterioOrden, SentidoOrden } from '../types';
import { UsuarioFormModal } from './components/UsuarioFormModal';
import {
  disciplinasIdsParaApi,
  type UsuarioCreateFormValues,
  type UsuarioEditFormValues,
} from '../schemas/usuario.schema';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

const COLUMNAS_EXPORT_USUARIOS: ExportColumn<Usuario>[] = [
  { header: 'Usuario', accessor: (u) => `${u.nombre} ${u.apellido}`.trim() },
  { header: 'DNI', accessor: (u) => formatearDni(u.dni) },
  { header: 'Email', accessor: (u) => u.email },
  { header: 'Roles', accessor: (u) => u.roles.map((r) => r.rol.nombre).join(', ') || '—' },
  { header: 'Estado', accessor: (u) => (u.activo ? 'Activo' : 'Inactivo') },
  {
    header: 'Alta',
    accessor: (u) => (u.creadoEn ? new Date(u.creadoEn).toLocaleDateString('es-AR') : '—'),
  },
];

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

  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);
  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rolId, setRolId] = useState<number | undefined>(undefined);
  const [ordenarPor, setOrdenarPor] = useState<CriterioOrden | undefined>(undefined);
  const [orden, setOrden] = useState<SentidoOrden | undefined>(undefined);

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

  const { data, isLoading, isError, error, isFetching } = useUsers({
    busqueda: busqueda || undefined,
    rolId,
    estado: filtroEstado,
    pagina,
    porPagina,
    ordenarPor,
    orden,
  });
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deactivateUsuario = useDeactivateUsuario();
  const activateUsuario = useActivateUsuario();

  const cambioDeEstadoEnCurso = deactivateUsuario.isPending || activateUsuario.isPending;

  const usuarios: Usuario[] = Array.isArray(data) ? data : (data?.items ?? []);
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

  function handleOrdenar(campo: CriterioOrden) {
    if (ordenarPor === campo) {
      if (orden === 'asc') {
        setOrden('desc');
      } else if (orden === 'desc') {
        // Tercer clic: vuelve a su estado primario (con las dos flechitas)
        setOrdenarPor(undefined);
        setOrden(undefined);
      } else {
        setOrden('asc');
      }
    } else {
      setOrdenarPor(campo);
      setOrden('asc');
    }
    setPagina(1);
    setUsuarioDestacadoId(null);
  }

  const usuariosVisibles = useMemo(() => {
    const filtrados =
      filtroEstado !== 'todos'
        ? usuarios.filter((usuario) => {
            if (filtroEstado === 'activos') return usuario.activo;
            if (filtroEstado === 'inactivos') return !usuario.activo;
            return true;
          })
        : [...usuarios];

    if (ordenarPor && orden) {
      filtrados.sort((a, b) => {
      let comp: number;
      switch (ordenarPor) {
        case 'dni': {
          const dniA = Number(String(a.dni ?? '').replace(/\D/g, '')) || 0;
          const dniB = Number(String(b.dni ?? '').replace(/\D/g, '')) || 0;
          comp = dniA - dniB;
          break;
        }
        case 'email':
          comp = (a.email ?? '').localeCompare(b.email ?? '', 'es', { sensitivity: 'base' });
          break;
        case 'roles': {
          const rA = a.roles.map((r) => r.rol.nombre).sort().join(', ');
          const rB = b.roles.map((r) => r.rol.nombre).sort().join(', ');
          comp = rA.localeCompare(rB, 'es', { sensitivity: 'base' });
          break;
        }
        case 'estado':
          comp = (b.activo ? 1 : 0) - (a.activo ? 1 : 0);
          break;
        case 'fecha': {
          const fA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
          const fB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
          comp = fA - fB;
          break;
        }
        case 'nombre':
        default: {
          const nA = `${a.nombre} ${a.apellido}`.trim().toLowerCase();
          const nB = `${b.nombre} ${b.apellido}`.trim().toLowerCase();
          comp = nA.localeCompare(nB, 'es', { sensitivity: 'base' });
          break;
        }
      }
      return orden === 'asc' ? comp : -comp;
      });
    }

    const destacado = filtrados.find((usuario) => usuario.id === usuarioDestacadoId);
    if (!destacado) {
      return filtrados;
    }

    return [destacado, ...filtrados.filter((usuario) => usuario.id !== destacado.id)];
  }, [usuarios, filtroEstado, usuarioDestacadoId, ordenarPor, orden]);

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
    <div className="space-y-4">
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
          <div className="relative h-0 w-0 overflow-hidden">
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
            <TableExportMenu<Usuario>
              filename="usuarios"
              title="Usuarios administrativos"
              disabled={isLoading && !data}
              columns={COLUMNAS_EXPORT_USUARIOS}
              fetchRows={async () => {
                const res = await usuariosApi.list({
                  busqueda: busqueda || undefined,
                  rolId,
                  estado: filtroEstado,
                  pagina: 1,
                  porPagina: 10000,
                  ordenarPor,
                  orden,
                });
                return Array.isArray(res) ? res : (res?.items ?? []);
              }}
            />

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
        <div>
          <UsuariosGrid
            usuarios={usuariosVisibles}
            usuarioDestacadoId={usuarioDestacadoId}
            accionesDeshabilitadas={cambioDeEstadoEnCurso}
            ordenarPor={ordenarPor}
            orden={orden}
            onOrdenar={handleOrdenar}
            onEditar={abrirEdicion}
            onCambiarEstado={setUsuarioAConfirmar}
          />

          {hayResultados && (
            <TablePagination
              pagina={pagina}
              porPagina={porPagina}
              total={totalUsuarios}
              isFetching={isFetching}
              onChangePagina={setPagina}
              onChangePorPagina={(nuevo) => {
                setPorPagina(nuevo);
                setPagina(1);
              }}
              srSummary={`${totalUsuarios} usuario(s)`}
            />
          )}
        </div>
      )}
    </div>
  );
}
