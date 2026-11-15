import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useOrdenPago, useSimularPago } from '@/features/pasarela/hooks/usePasarela';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalSpinner,
  PortalSurface,
  PortalTitleBar,
} from '../components/PortalUI';

export function PortalSimuladorPagoPage() {
  const [params] = useSearchParams();
  const referencia = params.get('referencia');
  const navigate = useNavigate();
  const { data: orden, isLoading, isError, error } = useOrdenPago(referencia);
  const simular = useSimularPago();

  async function resolver(aprobado: boolean) {
    if (!referencia) return;
    try {
      await simular.mutateAsync({ referencia, aprobado });
      navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(referencia)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo simular el pago.');
    }
  }

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Simulador de pago"
        summary="Pasarela de prueba para entornos sin credenciales de Mercado Pago."
      />

      <PortalSurface className="mx-auto max-w-xl p-6 sm:p-7">
        {!referencia ? (
          <p className="text-center text-sm text-slate-400">Falta la referencia de la orden.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <PortalSpinner />
          </div>
        ) : isError || !orden ? (
          <p className="text-center text-sm text-rose-400">
            {error instanceof Error ? error.message : 'No se encontró la orden de pago.'}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-[5px] border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-200">
              <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <span>Simulación: elegí el resultado del pago. No se cobra dinero real.</span>
            </div>

            <div className="rounded-[5px] border border-slate-300/[0.10] bg-[#070b14] p-4">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Concepto
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{orden.descripcion}</div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-300/[0.08] pt-3">
                <span className="text-sm font-medium text-slate-300">Total</span>
                <span className="text-lg font-semibold text-blue-400 tabular-nums">
                  ${orden.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {orden.estado !== 'PENDIENTE' ? (
              <p className="text-center text-sm text-slate-400">
                Esta orden ya no está pendiente ({orden.estado.toLowerCase()}).
              </p>
            ) : (
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-300/[0.08] pt-4">
                <PortalButton
                  variant="danger"
                  onClick={() => void resolver(false)}
                  disabled={simular.isPending}
                  data-testid="simulador-rechazar"
                >
                  <XCircle size={15} /> Rechazar pago
                </PortalButton>
                <PortalButton
                  variant="primary"
                  onClick={() => void resolver(true)}
                  disabled={simular.isPending}
                  data-testid="simulador-aprobar"
                >
                  <CheckCircle2 size={15} /> Aprobar pago
                </PortalButton>
              </div>
            )}
          </div>
        )}
      </PortalSurface>
    </div>
  );
}
