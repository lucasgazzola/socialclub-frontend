import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, DollarSign, Filter, Search, Users } from 'lucide-react';
import { Card, Input, Select, Spinner, TablePagination, TableExportMenu } from '@/components/ui';
import type { ExportColumn } from '@/lib/utils/exportTable';
import { formatearDni } from '@/lib/utils/dni';
import { ROUTES } from '@/routes/paths';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import { pagosApi } from '../api/pagos.api';
import { useMorososCuotaDeportiva } from '../hooks/useMorososCuotaDeportiva';
import { MorososCuotaDeportivaTable } from '../components/MorososCuotaDeportivaTable';
import type { FiltrosMorososCuotaDeportiva, MorosoCuotaDeportiva } from '../types';

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

const COLUMNAS_EXPORT_MOROSOS_DEPORTIVOS: ExportColumn<MorosoCuotaDeportiva>[] = [
  { header: 'Participante', accessor: (m) => m.nombreCompleto },
  { header: 'DNI', accessor: (m) => formatearDni(m.dni) },
  {
    header: 'Deuda por disciplina',
    accessor: (m) =>
      m.disciplinas
        .map((d) => `${d.disciplinaNombre} (${d.cantidadPeriodos} per. · ${formatMonto(d.montoAdeudado)})`)
        .join(' | '),
  },
  { header: 'Períodos', accessor: (m) => m.cantidadPeriodos },
  { header: 'Deuda total', accessor: (m) => m.montoTotalDeuda },
];

/**
 * US-23 — Morosos de cuota deportiva: quienes tienen al menos una cuota vencida
 * (después del día 10 de su mes) e impaga. Misma estructura que US-19.
 */
export function MorososCuotaDeportivaPage() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [ordenarPor, setOrdenarPor] = useState<'monto' | 'periodos'>('monto');
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const { disciplinas } = useDisciplinasActivas();

  const filtros: FiltrosMorososCuotaDeportiva = useMemo(
    () => ({
      busqueda: busqueda.trim() || undefined,
      disciplinaId,
      ordenarPor,
      orden,
    }),
    [busqueda, disciplinaId, ordenarPor, orden],
  );
  const { data, isLoading, isError, error, isFetching } = useMorososCuotaDeportiva(filtros);
  const items = data?.items ?? [];
  const totalItems = data?.total ?? items.length;
  const yaVienePaginadoDelBackend = Boolean(data?.pagina && data?.porPagina);
  const itemsPaginados = yaVienePaginadoDelBackend
    ? items
    : items.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Morosos de Cuota Deportiva
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Participantes con cuotas deportivas vencidas sin pagar. La cuota de cada mes vence el día{' '}
          {data?.diaVencimiento ?? 10}.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Participantes morosos
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
            <div className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Deuda vencida total
            </div>
            <div className="mt-1 text-2xl font-bold text-rose-600" data-testid="deuda-total">
              {formatMonto(data?.deudaTotal ?? 0)}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            id="busqueda-morosos-deportivos"
            placeholder="Buscar por nombre, apellido o DNI..."
            aria-label="Buscar moroso por nombre, apellido o DNI"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            leftIcon={<Search />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TableExportMenu<MorosoCuotaDeportiva>
            filename="morosos-cuota-deportiva"
            title="Morosos de Cuota Deportiva"
            disabled={isLoading && !data}
            columns={COLUMNAS_EXPORT_MOROSOS_DEPORTIVOS}
            fetchRows={async () => {
              const res = await pagosApi.getMorososCuotaDeportiva({
                busqueda: busqueda.trim() || undefined,
                disciplinaId,
                ordenarPor,
                orden,
              });
              return res?.items ?? [];
            }}
          />

          <div className="w-52">
            <Select
              id="filtro-disciplina"
              aria-label="Filtrar por disciplina"
              leftIcon={<Filter />}
              value={disciplinaId ? String(disciplinaId) : ''}
              onChange={(e) => {
                setDisciplinaId(e.target.value ? Number(e.target.value) : undefined);
                setPagina(1);
              }}
            >
              <option value="">Todas las disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-56">
            <Select
              id="ordenar-morosos-deportivos"
              aria-label="Ordenar listado de morosos"
              value={`${ordenarPor}-${orden}`}
              onChange={(e) => {
                const [criterio, sentido] = e.target.value.split('-') as [
                  'monto' | 'periodos',
                  'asc' | 'desc',
                ];
                setOrdenarPor(criterio);
                setOrden(sentido);
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="text-brand-600 h-8 w-8" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          Error al cargar el listado de morosos:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      ) : (
        <div>
          <MorososCuotaDeportivaTable
            morosos={itemsPaginados}
            onCobrar={(moroso) => navigate(ROUTES.cobrarCuotaDeportivaDe(moroso.dni))}
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
    </div>
  );
}
