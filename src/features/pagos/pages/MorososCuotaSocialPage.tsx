import { useState, useMemo } from 'react';
import { Search, DollarSign, Users, AlertTriangle, Filter } from 'lucide-react';
import { Card, Input, Select, Spinner, TablePagination, TableExportMenu } from '@/components/ui';
import type { ExportColumn } from '@/lib/utils/exportTable';
import { formatearDni } from '@/lib/utils/dni';
import { pagosApi } from '../api/pagos.api';
import { useMorososCuotaSocial } from '../hooks/useMorososCuotaSocial';
import { MorososCuotaSocialTable } from '../components/MorososCuotaSocialTable';
import { ModalCobroCuotaSocio } from '../components/ModalCobroCuotaSocio';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import type { FiltrosMorososCuotaSocial, SocioMorosoCuotaSocial } from '../types';

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

const COLUMNAS_EXPORT_MOROSOS_SOCIAL: ExportColumn<SocioMorosoCuotaSocial>[] = [
  { header: 'Socio', accessor: (s) => s.nombreCompleto },
  { header: 'DNI', accessor: (s) => formatearDni(s.dni) },
  { header: 'Categoría', accessor: (s) => s.categoria },
  { header: 'Períodos adeudados', accessor: (s) => s.periodosAdeudados.join(', ') },
  { header: 'Cantidad períodos', accessor: (s) => s.cantidadPeriodos },
  { header: 'Deuda total', accessor: (s) => s.montoTotalDeuda },
];

export function MorososCuotaSocialPage() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [ordenarPor, setOrdenarPor] = useState<'monto' | 'periodos'>('monto');
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  // Modal de cobro
  const [socioCobro, setSocioCobro] = useState<{
    id: number;
    nombre: string;
    apellido: string;
    dni?: string;
  } | null>(null);

  const { data: categorias } = useCategorias();

  const filtros: FiltrosMorososCuotaSocial = useMemo(
    () => ({
      busqueda: busqueda.trim() || undefined,
      categoriaId,
      ordenarPor,
      orden,
    }),
    [busqueda, categoriaId, ordenarPor, orden],
  );

  const { data, isLoading, isError, error, isFetching } = useMorososCuotaSocial(filtros);
  const items = data?.items ?? [];
  const totalItems = data?.total ?? items.length;
  const yaVienePaginadoDelBackend = Boolean(data?.pagina && data?.porPagina);
  const itemsPaginados = yaVienePaginadoDelBackend
    ? items
    : items.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Morosos de Cuota Social
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consultá y gestioná el cobro a socios con cuotas sociales impagas.
          </p>
        </div>
      </header>

      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Socios Morosos
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900" data-testid="total-morosos">
              {data?.total ?? 0}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Deuda Total Acumulada
            </div>
            <div className="mt-1 text-2xl font-bold text-rose-600" data-testid="deuda-total">
              {formatMonto(data?.deudaTotalClub ?? 0)}
            </div>
          </div>
        </Card>
      </div>

      {/* Controles de Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Búsqueda por texto (nombre, apellido, DNI) */}
        <div className="w-full sm:max-w-xs">
          <Input
            id="busqueda-morosos"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            leftIcon={<Search />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TableExportMenu<SocioMorosoCuotaSocial>
            filename="morosos-cuota-social"
            title="Morosos de Cuota Social"
            disabled={isLoading && !data}
            columns={COLUMNAS_EXPORT_MOROSOS_SOCIAL}
            fetchRows={async () => {
              const res = await pagosApi.getMorososCuotaSocial({
                busqueda: busqueda.trim() || undefined,
                categoriaId,
                ordenarPor,
                orden,
              });
              return res?.items ?? [];
            }}
          />

          {/* Filtro por Categoría */}
          <div className="w-52">
            <Select
              id="filtro-categoria"
              aria-label="Filtrar por categoría"
              leftIcon={<Filter />}
              value={categoriaId ? String(categoriaId) : ''}
              onChange={(e) => {
                setCategoriaId(e.target.value ? Number(e.target.value) : undefined);
                setPagina(1);
              }}
            >
              <option value="">Todas las categorías</option>
              {categorias?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Ordenamiento */}
          <div className="w-56">
            <Select
              id="ordenar-por"
              aria-label="Ordenar listado de morosos"
              value={`${ordenarPor}-${orden}`}
              onChange={(e) => {
                const [criterio, dir] = e.target.value.split('-') as [
                  'monto' | 'periodos',
                  'asc' | 'desc',
                ];
                setOrdenarPor(criterio);
                setOrden(dir);
                setPagina(1);
              }}
            >
              <option value="monto-desc">Mayor deuda primero</option>
              <option value="monto-asc">Menor deuda primero</option>
              <option value="periodos-desc">Más períodos adeudados</option>
              <option value="periodos-asc">Menos períodos adeudados</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Estado de Carga o Error */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-brand-600" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          Error al cargar el listado de morosos:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      ) : (
        <div>
          <MorososCuotaSocialTable
            morosos={itemsPaginados}
            onCobrar={(socio) => setSocioCobro(socio)}
          />
          {items.length > 0 && (
            <TablePagination
              pagina={pagina}
              porPagina={porPagina}
              total={totalItems}
              isFetching={isFetching}
              onChangePagina={setPagina}
              onChangePorPagina={(nuevo) => {
                setPorPagina(nuevo);
                setPagina(1);
              }}
            />
          )}
        </div>
      )}

      {/* Modal de Cobro */}
      <ModalCobroCuotaSocio
        open={Boolean(socioCobro)}
        onClose={() => setSocioCobro(null)}
        socio={socioCobro}
      />
    </div>
  );
}
