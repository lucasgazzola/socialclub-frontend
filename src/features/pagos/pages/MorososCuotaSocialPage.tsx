import { useState, useMemo } from 'react';
import { Search, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { Card, Input, Select, Spinner } from '@/components/ui';
import { useMorososCuotaSocial } from '../hooks/useMorososCuotaSocial';
import { MorososCuotaSocialTable } from '../components/MorososCuotaSocialTable';
import { ModalCobroCuotaSocio } from '../components/ModalCobroCuotaSocio';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import type { FiltrosMorososCuotaSocial } from '../types';

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function MorososCuotaSocialPage() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [ordenarPor, setOrdenarPor] = useState<'monto' | 'periodos'>('monto');
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc');

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

  const { data, isLoading, isError, error } = useMorososCuotaSocial(filtros);

  return (
    <div className="space-y-6">
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
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Categoría */}
          <div className="w-48">
            <Select
              id="filtro-categoria"
              aria-label="Filtrar por categoría"
              value={categoriaId ? String(categoriaId) : ''}
              onChange={(e) =>
                setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
              }
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
        <MorososCuotaSocialTable
          morosos={data?.items ?? []}
          onCobrar={(socio) => setSocioCobro(socio)}
        />
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

