import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Filter, Plus, Search, X } from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Spinner,
  StatusTabs,
  TableExportMenu,
  TablePagination,
  type SentidoOrden,
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ExportColumn } from '@/lib/utils/exportTable';
import { espaciosApi } from '../api/espacios.api';
import { ConfigurarBloqueoModal } from '../components/ConfigurarBloqueoModal';
import { EspacioForm } from '../components/EspacioForm';
import { EspaciosTable, type CampoOrdenEspacio } from '../components/EspaciosTable';
import { useAgregarBloqueo, useCrearEspacio, useEspacios } from '../hooks/useEspacios';
import {
  MODALIDAD_RESERVA_LABELS,
  TIPO_ESPACIO_LABELS,
  type CreateBloqueoPayload,
  type CreateEspacioPayload,
  type Espacio,
  type EstadoEspacioFiltro,
  type TipoEspacio,
} from '../types';

const COLUMNAS_EXPORT_ESPACIOS: ExportColumn<Espacio>[] = [
  { header: 'Nombre', accessor: (e) => e.nombre },
  { header: 'Tipo', accessor: (e) => TIPO_ESPACIO_LABELS[e.tipo] ?? e.tipo },
  { header: 'Capacidad', accessor: (e) => e.capacidadMaxima },
  { header: 'Modalidad', accessor: (e) => MODALIDAD_RESERVA_LABELS[e.modalidad] ?? e.modalidad },
  { header: 'Ubicación', accessor: (e) => e.ubicacion ?? '—' },
  {
    header: 'Sub-espacios',
    accessor: (e) =>
      e.subespacios && e.subespacios.length > 0
        ? `${e.subespacios.length} (${e.subespacios.map((s) => s.nombre).join(', ')})`
        : '—',
  },
  {
    header: 'Disciplinas',
    accessor: (e) =>
      e.disciplinas && e.disciplinas.length > 0
        ? e.disciplinas.map((d) => d.disciplina.nombre).join(', ')
        : '—',
  },
  { header: 'Precio alquiler', accessor: (e) => Number(e.precio) },
  { header: 'Seña requerida', accessor: (e) => Number(e.montoSena) },
  { header: 'Estado', accessor: (e) => (e.activo ? 'Activo' : 'Inactivo') },
];

export function EspaciosPage() {
  const { usuario } = useAuth();
  const puedeMutar = !usuario || usuario.roles.includes('ADMIN');

  const [filtroEstado, setFiltroEstado] = useState<EstadoEspacioFiltro>('todos');
  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoEspacio | ''>('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ordenarPor, setOrdenarPor] = useState<CampoOrdenEspacio | undefined>(undefined);
  const [orden, setOrden] = useState<SentidoOrden | undefined>(undefined);

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [espacioBloqueo, setEspacioBloqueo] = useState<Espacio | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Debounce de 300ms en la búsqueda (ESTANDARES_CRUD_FULLSTACK.md)
  useEffect(() => {
    const trimmed = textoInput.trim();
    if (trimmed === busqueda) return;
    const timer = setTimeout(() => {
      setPagina(1);
      setBusqueda(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoInput, busqueda]);

  const { data, isLoading, isError, error, isFetching } = useEspacios({
    busqueda: busqueda || undefined,
    tipo: tipoFiltro || undefined,
    estado: filtroEstado,
    soloRaiz: busqueda ? undefined : true,
    pagina,
    porPagina,
    ordenarPor,
    orden,
  });

  const crearEspacio = useCrearEspacio();
  const agregarBloqueo = useAgregarBloqueo();

  const itemsRaw: Espacio[] = useMemo(
    () => (Array.isArray(data) ? data : (data?.items ?? [])),
    [data],
  );

  // Caché de contadores para StatusTabs (evita parpadeos o pérdida de contadores al cambiar de tab)
  const [cachedCounts, setCachedCounts] = useState<{
    todos: number;
    activos: number;
    inactivos: number;
  }>({ todos: 0, activos: 0, inactivos: 0 });

  useEffect(() => {
    if (data && !Array.isArray(data) && data.counts) {
      setCachedCounts({
        todos: data.counts.todos ?? 0,
        activos: data.counts.activos ?? 0,
        inactivos: data.counts.inactivos ?? 0,
      });
    } else if (Array.isArray(data)) {
      const activos = data.filter((e) => e.activo !== false).length;
      const inactivos = data.length - activos;
      setCachedCounts({
        todos: data.length,
        activos,
        inactivos,
      });
    }
  }, [data]);

  const counts =
    data && !Array.isArray(data) && data.counts
      ? {
          todos: data.counts.todos ?? cachedCounts.todos,
          activos: data.counts.activos ?? cachedCounts.activos,
          inactivos: data.counts.inactivos ?? cachedCounts.inactivos,
        }
      : cachedCounts;

  function handleOrdenar(campo: CampoOrdenEspacio) {
    if (ordenarPor === campo) {
      if (orden === 'asc') {
        setOrden('desc');
      } else if (orden === 'desc') {
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
  }

  // Si la API respondió un arreglo plano (ej. mocks en tests), filtramos y ordenamos en cliente;
  // si respondió PaginatedResponse, respetamos la página devuelta por el backend (y aplicamos sort local estable).
  const espaciosVisibles = useMemo(() => {
    let copia = [...itemsRaw];
    if (Array.isArray(data)) {
      if (filtroEstado === 'activos') copia = copia.filter((e) => e.activo !== false);
      if (filtroEstado === 'inactivos') copia = copia.filter((e) => e.activo === false);
    }
    if (ordenarPor && orden) {
      copia.sort((a, b) => {
        let comp = 0;
        switch (ordenarPor) {
          case 'tipo':
            comp = a.tipo.localeCompare(b.tipo, 'es');
            break;
          case 'capacidadMaxima':
            comp = a.capacidadMaxima - b.capacidadMaxima;
            break;
          case 'precio':
            comp = Number(a.precio) - Number(b.precio);
            break;
          case 'montoSena':
            comp = Number(a.montoSena) - Number(b.montoSena);
            break;
          case 'nombre':
          default:
            comp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            break;
        }
        return orden === 'asc' ? comp : -comp;
      });
    }
    return copia;
  }, [data, itemsRaw, filtroEstado, ordenarPor, orden]);

  const totalEspacios =
    data && !Array.isArray(data) ? data.total : espaciosVisibles.length;

  const espaciosPaginados = useMemo(
    () =>
      Array.isArray(data)
        ? espaciosVisibles.slice((pagina - 1) * porPagina, pagina * porPagina)
        : espaciosVisibles,
    [data, espaciosVisibles, pagina, porPagina],
  );

  const handleCrear = async (payload: CreateEspacioPayload) => {
    const creado = await crearEspacio.mutateAsync(payload);
    setModalCrearAbierto(false);
    setPagina(1);
    const cantSubs =
      creado?.subespacios?.length ??
      payload.cantidadSubespacios ??
      payload.subespacios?.length ??
      0;
    const sufijo = cantSubs > 0 ? ` con ${cantSubs} sub-espacios asociados` : '';
    setMensajeExito(
      `El espacio físico "${creado?.nombre ?? payload.nombre}"${sufijo} se registró correctamente.`,
    );
  };

  const handleAgregarBloqueo = async (espacioId: number, payload: CreateBloqueoPayload) => {
    await agregarBloqueo.mutateAsync({ espacioId, payload });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Espacios físicos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administrá las instalaciones del club, sus sub-espacios, disciplinas compatibles y bloqueos de agenda.
          </p>
        </div>

        {puedeMutar && (
          <Button
            onClick={() => setModalCrearAbierto(true)}
            className="self-start shadow-xs sm:self-auto"
          >
            <Plus size={16} aria-hidden="true" />
            Nuevo espacio
          </Button>
        )}
      </header>

      {mensajeExito && (
        <div
          role="status"
          data-testid="notificacion-exito-espacio"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar notificación"
            onClick={() => setMensajeExito(null)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <Modal
        open={modalCrearAbierto}
        title="Nuevo espacio físico"
        description="Completá los datos del espacio, sub-espacios (opcional), disciplinas compatibles y bloqueos de agenda iniciales."
        onClose={() => {
          if (!crearEspacio.isPending) setModalCrearAbierto(false);
        }}
        icon={<Building2 />}
        size="lg"
      >
        <EspacioForm
          onSubmit={handleCrear}
          onCancel={() => setModalCrearAbierto(false)}
          guardando={crearEspacio.isPending}
          submitLabel="Crear espacio"
        />
      </Modal>

      <ConfigurarBloqueoModal
        espacio={espacioBloqueo}
        open={espacioBloqueo !== null}
        onClose={() => setEspacioBloqueo(null)}
        onSubmit={handleAgregarBloqueo}
        guardando={agregarBloqueo.isPending}
      />

      {/* Controles de filtro y búsqueda (Patrón US-04 / ESTANDARES_CRUD_FULLSTACK.md) */}
      <div className="space-y-3">
        <div>
          <StatusTabs<EstadoEspacioFiltro>
            value={filtroEstado}
            onChange={(val) => {
              setFiltroEstado(val);
              setPagina(1);
            }}
            tabs={[
              { value: 'todos', label: 'Todos', count: counts.todos },
              { value: 'activos', label: 'Activos', count: counts.activos },
              { value: 'inactivos', label: 'Inactivos', count: counts.inactivos },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              id="busqueda-espacios"
              placeholder="Buscar por nombre o ubicación..."
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              leftIcon={<Search />}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <TableExportMenu<Espacio>
              filename="espacios-fisicos"
              title="Espacios físicos"
              disabled={isLoading && !data}
              columns={COLUMNAS_EXPORT_ESPACIOS}
              fetchRows={async () => {
                const res = await espaciosApi.list({
                  busqueda: busqueda || undefined,
                  tipo: tipoFiltro || undefined,
                  estado: filtroEstado,
                  soloRaiz: busqueda ? undefined : true,
                  pagina: 1,
                  porPagina: 100,
                  ordenarPor,
                  orden,
                });
                return Array.isArray(res) ? res : (res?.items ?? []);
              }}
            />

            <Select
              id="filtro-tipo-espacio"
              aria-label="Filtrar por tipo de espacio"
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value as TipoEspacio | '');
                setPagina(1);
              }}
              leftIcon={<Filter />}
              className="w-full sm:w-52"
            >
              <option value="">Todos los tipos</option>
              {(Object.keys(TIPO_ESPACIO_LABELS) as TipoEspacio[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_ESPACIO_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <Card className="border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar los espacios físicos.'}
        </Card>
      ) : espaciosPaginados.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          <Building2 className="mx-auto mb-2 text-slate-300" size={28} />
          No hay espacios físicos que coincidan con los filtros.
        </Card>
      ) : (
        <div>
          <EspaciosTable
            espacios={espaciosPaginados}
            puedeMutar={puedeMutar}
            ordenarPor={ordenarPor}
            orden={orden}
            onOrdenar={handleOrdenar}
            onConfigurarBloqueo={setEspacioBloqueo}
          />
          <TablePagination
            pagina={pagina}
            porPagina={porPagina}
            total={totalEspacios}
            isFetching={isFetching}
            onChangePagina={setPagina}
            onChangePorPagina={(nuevo) => {
              setPorPagina(nuevo);
              setPagina(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
