import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, CreditCard, History } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMisCuotas } from '@/features/pagos/hooks/useMisCuotas';
import { useIniciarPagoCuotas } from '@/features/pagos/hooks/useIniciarPagoCuotas';
import {
  useIniciarPagoDeportivo,
  useMisCuotasDeportivas,
} from '@/features/pagos/hooks/useMisCuotasDeportivas';
import { useHistorialPagos } from '@/features/pagos/hooks/useHistorialPagos';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { etiquetaMetodoPago } from '@/features/pasarela/types';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
import { PortalConfirmarPagoModal } from '../components/PortalModals';
import {
  PortalButton,
  PortalEmptyState,
  PortalSegmentedSwitch,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

/**
 * Gestión de cuotas para socios: selección con acentos azules y comprobantes en lista cronológica (cero tabla admin).
 */
export function PortalCuotasPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const esOFueSocio = Boolean(
    usuario?.persona?.membresias && usuario.persona.membresias.length > 0,
  );

  const { data: resumen, isLoading: isLoadingCuotas, isError, error } = useMisCuotas({
    enabled: esOFueSocio,
  });
  const { data: historial, isLoading: isLoadingHistorial } = useHistorialPagos({
    enabled: esOFueSocio,
  });
  const { data: deportivas } = useMisCuotasDeportivas({ enabled: esOFueSocio });
  const iniciarPago = useIniciarPagoCuotas();
  const iniciarPagoDeportivo = useIniciarPagoDeportivo();

  const [selectedPeriodos, setSelectedPeriodos] = useState<string[]>([]);
  const [selectedDeportivas, setSelectedDeportivas] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalDeportivoOpen, setIsModalDeportivoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

  if (!esOFueSocio) {
    return <Navigate to={ROUTES.miClub} replace />;
  }

  const cuotasPendientes = resumen?.cuotasPendientes ?? [];
  const allSelected =
    cuotasPendientes.length > 0 && selectedPeriodos.length === cuotasPendientes.length;

  const togglePeriodo = (periodo: string) => {
    setSelectedPeriodos((prev) =>
      prev.includes(periodo) ? prev.filter((p) => p !== periodo) : [...prev, periodo],
    );
  };

  const selectedCuotasObjects = cuotasPendientes.filter((c) =>
    selectedPeriodos.includes(c.periodo),
  );
  const totalSeleccionado = selectedCuotasObjects.reduce((sum, c) => sum + c.monto, 0);

  const cuotasDeportivas = (deportivas?.cuotasPendientes ?? []).filter((cuota) => cuota.monto !== null);
  const claveDeportiva = (disciplinaId: number, periodo: string) => `${disciplinaId}:${periodo}`;
  const deportivasSeleccionadas = cuotasDeportivas.filter((cuota) =>
    selectedDeportivas.includes(claveDeportiva(cuota.disciplinaId, cuota.periodo)),
  );
  const totalDeportivo = deportivasSeleccionadas.reduce((sum, cuota) => sum + (cuota.monto ?? 0), 0);
  const todasDeportivas =
    cuotasDeportivas.length > 0 && selectedDeportivas.length === cuotasDeportivas.length;

  const toggleDeportiva = (disciplinaId: number, periodo: string) => {
    const clave = claveDeportiva(disciplinaId, periodo);
    setSelectedDeportivas((prev) =>
      prev.includes(clave) ? prev.filter((item) => item !== clave) : [...prev, clave],
    );
  };

  const handleConfirmPago = async () => {
    if (selectedPeriodos.length === 0) return;
    try {
      const orden = await iniciarPago.mutateAsync(selectedPeriodos);
      if (orden.urlPago) {
        irAPagar(orden.urlPago);
      } else {
        navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(orden.referencia)}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo iniciar el pago. Intentá nuevamente.',
      );
    }
  };

  const handleConfirmPagoDeportivo = async () => {
    if (deportivasSeleccionadas.length === 0) return;
    try {
      const orden = await iniciarPagoDeportivo.mutateAsync(
        deportivasSeleccionadas.map((cuota) => ({
          disciplinaId: cuota.disciplinaId,
          periodo: cuota.periodo,
        })),
      );
      if (orden.urlPago) {
        irAPagar(orden.urlPago);
      } else {
        navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(orden.referencia)}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo iniciar el pago. Intentá nuevamente.',
      );
    }
  };

  if (isLoadingCuotas) {
    return (
      <div className="flex h-56 items-center justify-center">
        <PortalSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-rose-200">
        <h2 className="text-sm font-semibold">No pudimos cargar tus cuotas</h2>
        <p className="mt-1 text-xs text-rose-300">
          {error instanceof Error
            ? error.message
            : 'No se pudo obtener el estado de tus cuotas. Verificá tu membresía activa.'}
        </p>
      </PortalSurface>
    );
  }

  const estadoFinanciero = resumen?.estadoFinanciero ?? 'AL_DIA';

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Mis cuotas"
        summary={`Categoría ${resumen?.categoria ?? 'Socio'} · Estado de períodos y comprobantes`}
        actions={
          <PortalTag
            tone={
              estadoFinanciero === 'AL_DIA'
                ? 'active'
                : estadoFinanciero === 'MOROSO'
                  ? 'danger'
                  : 'pending'
            }
            dot
          >
            {estadoFinanciero === 'AL_DIA'
              ? 'Al día'
              : estadoFinanciero === 'MOROSO'
                ? `Moroso (${cuotasPendientes.length})`
                : `${cuotasPendientes.length} pendiente(s)`}
          </PortalTag>
        }
      />

      {/* Panel unificado de estado de cuenta (Billetera Global Fan) */}
      <PortalSurface variant="pass" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-blue-400 to-transparent"
        />
        <div className="grid grid-cols-1 divide-y divide-white/[0.08] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          <div className="p-5 sm:p-6 lg:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">
              Saldo total adeudado
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white tabular-nums sm:text-4xl">
              ${(resumen?.totalAdeudado ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              Plan de membresía: <span className="font-medium text-slate-200">{resumen?.categoria ?? '—'}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-white/[0.08] bg-[#040811]/60 lg:col-span-5">
            <div className="flex flex-col justify-center p-5">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-400">
                Por pagar
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-blue-400 tabular-nums">
                {cuotasPendientes.length}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">períodos</p>
            </div>
            <div className="flex flex-col justify-center p-5">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-400">
                Abonados
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-white tabular-nums">
                {historial?.length ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">comprobantes</p>
            </div>
          </div>
        </div>
      </PortalSurface>

      <PortalSegmentedSwitch<'pendientes' | 'historial'>
        ariaLabel="Secciones de cuotas"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'pendientes', label: 'Cuotas pendientes', count: cuotasPendientes.length },
          { value: 'historial', label: 'Historial de pagos', count: historial?.length ?? 0 },
        ]}
      />

      {activeTab === 'pendientes' ? (
        <>
        {cuotasPendientes.length === 0 ? (
          <PortalEmptyState
            icon={<CheckCircle2 size={20} />}
            title={
              cuotasDeportivas.length > 0
                ? 'Estás al día con la cuota social'
                : 'Estás al día con tus cuotas'
            }
            description={
              cuotasDeportivas.length > 0
                ? 'No debés meses de la cuota social. Abajo están las cuotas deportivas pendientes.'
                : 'No registrás períodos pendientes de pago. Tu membresía y acceso están completamente habilitados.'
            }
          />
        ) : (
          <div className="space-y-3">
            {/* Barra de selección y total a abonar */}
            <PortalSurface className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedPeriodos(
                    allSelected ? [] : cuotasPendientes.map((c) => c.periodo),
                  )
                }
                className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-[2px] border transition-colors',
                    allSelected
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-500/60 bg-transparent',
                  )}
                >
                  {allSelected && <Check size={11} strokeWidth={3} />}
                </span>
                <span>{allSelected ? 'Deseleccionar todas' : 'Seleccionar todas las cuotas'}</span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-400">
                  Seleccionadas:{' '}
                  <strong className="font-semibold text-blue-400 tabular-nums">
                    ${totalSeleccionado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
                <PortalButton
                  variant="primary"
                  size="sm"
                  disabled={selectedPeriodos.length === 0 || iniciarPago.isPending}
                  onClick={() => setIsModalOpen(true)}
                >
                  <CreditCard size={14} />
                  Pagar seleccionadas ({selectedPeriodos.length})
                </PortalButton>
              </div>
            </PortalSurface>

            {/* Tiras afiladas de cuotas */}
            <PortalSurface className="divide-y divide-white/[0.08] overflow-hidden">
              {cuotasPendientes.map((cuota) => {
                const selected = selectedPeriodos.includes(cuota.periodo);
                return (
                  <button
                    key={cuota.periodo}
                    type="button"
                    // Funciona como casilla: anuncia si la cuota está elegida para pagar.
                    aria-pressed={selected}
                    onClick={() => togglePeriodo(cuota.periodo)}
                    className={cn(
                      'flex w-full flex-wrap items-center justify-between gap-4 border-l-2 px-4 py-3.5 text-left transition-colors cursor-pointer',
                      selected
                        ? 'border-l-blue-500 bg-blue-500/[0.09]'
                        : 'border-l-transparent hover:bg-white/[0.02]',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors',
                          selected
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-slate-500/60 bg-transparent',
                        )}
                      >
                        {selected && <Check size={11} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white tabular-nums">
                          Período {cuota.periodo}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{cuota.categoriaNombre}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <PortalTag tone="pending">Pendiente</PortalTag>
                      <span className="min-w-[92px] text-right text-sm font-semibold text-white tabular-nums">
                        ${cuota.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </PortalSurface>
          </div>
        )}

        {cuotasDeportivas.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Cuota deportiva</h2>
            <PortalSurface className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedDeportivas(
                    todasDeportivas
                      ? []
                      : cuotasDeportivas.map((cuota) =>
                          claveDeportiva(cuota.disciplinaId, cuota.periodo),
                        ),
                  )
                }
                className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-[2px] border transition-colors',
                    todasDeportivas
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-500/60 bg-transparent',
                  )}
                >
                  {todasDeportivas && <Check size={11} strokeWidth={3} />}
                </span>
                <span>
                  {todasDeportivas ? 'Deseleccionar todas' : 'Seleccionar todas las cuotas deportivas'}
                </span>
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-400">
                  Seleccionadas:{' '}
                  <strong className="font-semibold text-blue-400 tabular-nums">
                    ${totalDeportivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
                <PortalButton
                  variant="primary"
                  size="sm"
                  disabled={deportivasSeleccionadas.length === 0 || iniciarPagoDeportivo.isPending}
                  onClick={() => setIsModalDeportivoOpen(true)}
                >
                  <CreditCard size={14} />
                  Pagar disciplinas ({deportivasSeleccionadas.length})
                </PortalButton>
              </div>
            </PortalSurface>
            <PortalSurface className="divide-y divide-white/[0.08] overflow-hidden">
              {cuotasDeportivas.map((cuota) => {
                const clave = claveDeportiva(cuota.disciplinaId, cuota.periodo);
                const selected = selectedDeportivas.includes(clave);
                return (
                  <button
                    key={clave}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDeportiva(cuota.disciplinaId, cuota.periodo)}
                    className={cn(
                      'flex w-full flex-wrap items-center justify-between gap-4 border-l-2 px-4 py-3.5 text-left transition-colors cursor-pointer',
                      selected
                        ? 'border-l-blue-500 bg-blue-500/[0.09]'
                        : 'border-l-transparent hover:bg-white/[0.02]',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors',
                          selected
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-slate-500/60 bg-transparent',
                        )}
                      >
                        {selected && <Check size={11} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{cuota.disciplinaNombre}</p>
                        <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
                          Período {cuota.periodo}
                          {cuota.categoriaNombre ? ` · ${cuota.categoriaNombre}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <PortalTag tone="pending">Pendiente</PortalTag>
                      <span className="min-w-[92px] text-right text-sm font-semibold text-white tabular-nums">
                        ${(cuota.monto ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </PortalSurface>
          </div>
        )}
        </>
      ) : isLoadingHistorial ? (
        <div className="flex h-44 items-center justify-center">
          <PortalSpinner />
        </div>
      ) : !historial || historial.length === 0 ? (
        <PortalEmptyState
          icon={<History size={20} />}
          title="Sin pagos registrados"
          description="Cuando abones una cuota social online o en secretaría, verás el comprobante en esta lista."
        />
      ) : (
        /* Historial cronológico de comprobantes — cero tabla de administración */
        <PortalSurface className="divide-y divide-slate-300/[0.08] overflow-hidden">
          {historial.map((pago) => (
            <div
              key={pago.id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-blue-400/25 bg-blue-500/10 text-xs font-semibold text-blue-300 tabular-nums">
                  {pago.periodo.slice(5)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white tabular-nums">
                    Cuota {pago.periodo}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    Abonada el {new Date(pago.fechaPago).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PortalTag tone="info">{etiquetaMetodoPago(pago.metodoPago)}</PortalTag>
                <span className="min-w-[88px] text-right text-sm font-semibold text-white tabular-nums">
                  ${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </PortalSurface>
      )}

      <PortalConfirmarPagoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        titulo={`Cuotas seleccionadas (${selectedPeriodos.length})`}
        detalle={selectedPeriodos.join(' · ')}
        total={totalSeleccionado}
        onConfirmar={() => void handleConfirmPago()}
        isLoading={iniciarPago.isPending}
      />

      <PortalConfirmarPagoModal
        open={isModalDeportivoOpen}
        onClose={() => setIsModalDeportivoOpen(false)}
        titulo={`Cuotas deportivas (${deportivasSeleccionadas.length})`}
        detalle={deportivasSeleccionadas
          .map((cuota) => `${cuota.disciplinaNombre} ${cuota.periodo}`)
          .join(' · ')}
        total={totalDeportivo}
        onConfirmar={() => void handleConfirmPagoDeportivo()}
        isLoading={iniciarPagoDeportivo.isPending}
      />
    </div>
  );
}
