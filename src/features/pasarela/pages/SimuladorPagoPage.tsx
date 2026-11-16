import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useOrdenPago, useSimularPago } from '../hooks/usePasarela';

/**
 * TASK-51 · Simulador de pago. Es la «pasarela» cuando la API no tiene
 * credenciales de Mercado Pago (desarrollo, E2E, demos sin internet): se
 * aprueba o rechaza el pago y se vuelve al resultado, igual que con Mercado
 * Pago. No se cobra nada.
 */
export function SimuladorPagoPage() {
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
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Simulador de pago</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pasarela de prueba: reemplaza a Mercado Pago cuando no hay credenciales configuradas.
        </p>
      </header>

      <Card className="mx-auto max-w-xl p-8">
        {!referencia ? (
          <p className="text-center text-sm text-slate-600">Falta la referencia de la orden.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-8 w-8" />
          </div>
        ) : isError || !orden ? (
          <p className="text-center text-sm text-rose-700">
            {error instanceof Error ? error.message : 'No se encontró la orden de pago.'}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <FlaskConical size={16} className="mt-0.5 shrink-0" />
              <span>Simulación: elegí el resultado del pago. No se cobra dinero real.</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">Concepto</div>
              <div className="text-sm font-semibold text-slate-800">{orden.descripcion}</div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-sm font-bold text-slate-700">Total</span>
                <span className="text-lg font-extrabold text-brand-700">
                  ${orden.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {orden.estado !== 'PENDIENTE' ? (
              <p className="text-center text-sm text-slate-600">
                Esta orden ya no está pendiente ({orden.estado.toLowerCase()}).
              </p>
            ) : (
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => void resolver(false)}
                  disabled={simular.isPending}
                  data-testid="simulador-rechazar"
                >
                  <XCircle size={16} /> Rechazar pago
                </Button>
                <Button
                  variant="success"
                  onClick={() => void resolver(true)}
                  disabled={simular.isPending}
                  data-testid="simulador-aprobar"
                >
                  <CheckCircle2 size={16} /> Aprobar pago
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
