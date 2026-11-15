import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, CreditCard, History, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMisCuotas } from '@/features/pagos/hooks/useMisCuotas';
import { useIniciarPagoCuotas } from '@/features/pagos/hooks/useIniciarPagoCuotas';
import { useHistorialPagos } from '@/features/pagos/hooks/useHistorialPagos';
import { ConfirmarPagoModal } from '@/features/pasarela/components/ConfirmarPagoModal';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { etiquetaMetodoPago } from '@/features/pasarela/types';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
import {
  PortalButton,
  PortalEmptyState,
  PortalPageHeader,
  PortalPanel,
  PortalSegmentedTabs,
  PortalStatusPill,
} from '../components/PortalUI';

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
  const iniciarPago = useIniciarPagoCuotas();

  const [selectedPeriodos, setSelectedPeriodos] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

  if (!esOFueSocio) {
    return <Navigate to={ROUTES.dashboard} replace />;
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

  if (isLoadingCuotas) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-7 w-7 text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <PortalPanel className="border-rose-500/25 bg-rose-500/10 p-6 text-rose-200">
        <h2 className="text-base font-semibold">No pudimos cargar tus cuotas</h2>
        <p className="mt-1 text-sm text-rose-300/90">
          {error instanceof Error
            ? error.message
            : 'No se pudo obtener el estado de cuotas. Verificá tu membresía activa.'}
        </p>
      </PortalPanel>
    );
  }

  const estadoFinanciero = resumen?.estadoFinanciero ?? 'AL_DIA';

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Mis cuotas"
        subtitle={`Categoría ${resumen?.categoria ?? 'Socio'} · Consultá tus períodos pendientes y comprobantes abonados.`}
        actions={
          <PortalStatusPill
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
          </PortalStatusPill>
        }
      />

      <PortalSegmentedTabs<'pendientes' | 'historial'>
        ariaLabel="Secciones de cuotas"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'pendientes', label: 'Cuotas pendientes', count: cuotasPendientes.length },
          { value: 'historial', label: 'Historial de pagos', count: historial?.length ?? 0 },
        ]}
      />

      {activeTab === 'pendientes' ? (
        cuotasPendientes.length === 0 ? (
          <PortalEmptyState
            icon={<CheckCircle2 size={22} className="text-emerald-400" />}
            title="Estás al día con tus cuotas"
            description="No registrás períodos pendientes de pago. Tu acceso y membresía se encuentran habilitados."
          />
        ) : (
          <div className="space-y-4">
            {/* Barra superior de selección */}
            <PortalPanel className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPeriodos(
                      allSelected ? [] : cuotasPendientes.map((c) => c.periodo),
                    )
                  }
                  className="inline-flex items-center gap-2 text-xs font-medium text-zinc-200 transition-colors hover:text-white cursor-pointer"
                >
                  {allSelected ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-white text-zinc-950">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <Square size={16} className="text-zinc-500" />
                  )}
                  {allSelected ? 'Desmarcar todas' : 'Seleccionar todas'}
                </button>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {selectedPeriodos.length} de {cuotasPendientes.length} seleccionadas
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right">
                  <span className="block text-[11px] text-zinc-400">Total a pagar</span>
                  <span className="text-lg font-semibold tabular-nums text-white">
                    ${totalSeleccionado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <PortalButton
                  variant="primary"
                  size="sm"
                  disabled={selectedPeriodos.length === 0}
                  onClick={() => setIsModalOpen(true)}
                >
                  <CreditCard size={14} />
                  Pagar seleccionadas
                </PortalButton>
              </div>
            </PortalPanel>

            {/* Lista oscura de cuotas */}
            <div className="space-y-2.5">
              {cuotasPendientes.map((cuota) => {
                const selected = selectedPeriodos.includes(cuota.periodo);
                return (
                  <button
                    key={cuota.periodo}
                    type="button"
                    onClick={() => togglePeriodo(cuota.periodo)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left',
                      'transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.995] cursor-pointer',
                      selected
                        ? 'border-white/30 bg-[#141822]'
                        : 'border-white/[0.08] bg-[#0d1016] hover:border-white/[0.15] hover:bg-[#11151e]',
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          selected
                            ? 'border-white bg-white text-zinc-950'
                            : 'border-white/20 bg-transparent',
                        )}
                      >
                        {selected && <Check size={13} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white tabular-nums">
                          Período {cuota.periodo}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {cuota.categoriaNombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <PortalStatusPill tone="pending">Pendiente</PortalStatusPill>
                      <span className="min-w-[90px] text-right text-base font-semibold tabular-nums text-white">
                        ${cuota.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )
      ) : isLoadingHistorial ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-7 w-7 text-zinc-400" />
        </div>
      ) : !historial || historial.length === 0 ? (
        <PortalEmptyState
          icon={<History size={22} />}
          title="Sin pagos registrados"
          description="Cuando abones una cuota social online o en secretaría, verás el comprobante aquí."
        />
      ) : (
        <PortalPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.07] bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Pago</th>
                  <th className="px-5 py-3.5">Período</th>
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5">Método</th>
                  <th className="px-5 py-3.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {historial.map((pago) => (
                  <tr key={pago.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-500 tabular-nums">
                      #{pago.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white tabular-nums">
                      {pago.periodo}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 tabular-nums">
                      {new Date(pago.fechaPago).toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <PortalStatusPill tone="active">
                        {etiquetaMetodoPago(pago.metodoPago)}
                      </PortalStatusPill>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-white tabular-nums">
                      ${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PortalPanel>
      )}

      <ConfirmarPagoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        titulo={`Períodos a pagar (${selectedCuotasObjects.length})`}
        detalle={selectedCuotasObjects.map((c) => c.periodo).join(', ')}
        total={totalSeleccionado}
        onConfirmar={() => void handleConfirmPago()}
        isLoading={iniciarPago.isPending}
      />
    </div>
  );
}
