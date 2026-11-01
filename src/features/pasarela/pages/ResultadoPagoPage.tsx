import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { irAPagar, useCancelarOrden, useConfirmarOrden } from '../hooks/usePasarela';
import type { OrdenPago } from '../types';

/** Reintentos de la confirmación mientras la pasarela informa el pago como «en proceso». */
const REINTENTOS = 5;
const ESPERA_MS = 3000;

const DESTINO: Record<OrdenPago['concepto'], { ruta: string; texto: string }> = {
  CUOTA_SOCIAL: { ruta: ROUTES.misCuotas, texto: 'Ver mis cuotas' },
  ENTRADAS: { ruta: ROUTES.misEntradas, texto: 'Ver mis entradas' },
};

/**
 * TASK-51 · Vuelta de la pasarela. Mercado Pago redirige acá con
 * `?referencia=…&payment_id=…&status=…`; la página no confía en `status`:
 * le pide a la API que consulte el pago y acredite.
 */
export function ResultadoPagoPage() {
  const [params] = useSearchParams();
  const referencia = params.get('referencia');
  // Mercado Pago manda payment_id (y collection_id, su nombre anterior).
  const idPago = params.get('payment_id') ?? params.get('collection_id') ?? undefined;
  const idPagoValido = idPago && idPago !== 'null' ? idPago : undefined;

  const confirmar = useConfirmarOrden();
  const cancelar = useCancelarOrden();
  const [orden, setOrden] = useState<OrdenPago | null>(null);
  const intentos = useRef(0);

  useEffect(() => {
    if (!referencia) return;
    let cancelado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const consultar = () => {
      confirmar.mutate(
        { referencia, idPago: idPagoValido },
        {
          onSuccess: (resultado) => {
            if (cancelado) return;
            setOrden(resultado);
            const enProceso = resultado.detalleEstado?.startsWith('Pago en proceso');
            if (resultado.estado === 'PENDIENTE' && enProceso && intentos.current < REINTENTOS) {
              intentos.current += 1;
              espera = setTimeout(consultar, ESPERA_MS);
            }
          },
        },
      );
    };
    consultar();

    return () => {
      cancelado = true;
      if (espera) clearTimeout(espera);
    };
    // Se confirma una vez por referencia; `confirmar` cambia en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencia, idPagoValido]);

  async function handleCancelar() {
    if (!orden) return;
    try {
      setOrden(await cancelar.mutateAsync(orden.referencia));
      toast.success('Cancelaste el pago.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cancelar el pago.');
    }
  }

  if (!referencia) {
    return (
      <Contenedor>
        <Estado
          icono={<AlertTriangle className="h-10 w-10 text-amber-500" />}
          titulo="No encontramos el pago"
          texto="El enlace no tiene la referencia de una orden de pago."
        />
        <Acciones>
          <Link to={ROUTES.dashboard}>
            <Button variant="outline">Ir al inicio</Button>
          </Link>
        </Acciones>
      </Contenedor>
    );
  }

  if (!orden) {
    return (
      <Contenedor>
        {confirmar.isError ? (
          <Estado
            icono={<AlertTriangle className="h-10 w-10 text-amber-500" />}
            titulo="No pudimos verificar el pago"
            texto={confirmar.error instanceof Error ? confirmar.error.message : 'Intentá nuevamente.'}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-sm text-slate-500">
            <Spinner className="h-8 w-8" />
            Verificando el pago…
          </div>
        )}
      </Contenedor>
    );
  }

  const destino = DESTINO[orden.concepto];
  const monto = `$${orden.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  return (
    <Contenedor>
      {orden.estado === 'APROBADA' && (
        <Estado
          icono={<CheckCircle2 className="h-10 w-10 text-emerald-500" />}
          titulo="¡Pago aprobado!"
          texto={`${orden.descripcion} · ${monto}`}
          testId="pago-aprobado"
        />
      )}
      {orden.estado === 'PENDIENTE' && !orden.detalleEstado && (
        <Estado
          icono={<Clock className="h-10 w-10 text-amber-500" />}
          titulo="El pago todavía no se completó"
          texto={`${orden.descripcion} · ${monto}. Podés volver a la pasarela para terminarlo.`}
          testId="pago-pendiente"
        />
      )}
      {orden.estado === 'PENDIENTE' && orden.detalleEstado?.startsWith('Pago en proceso') && (
        <Estado
          icono={<Clock className="h-10 w-10 text-amber-500" />}
          titulo="El pago está en proceso"
          texto="Mercado Pago todavía lo está revisando. Te avisamos acá en cuanto se acredite; también podés volver más tarde."
          testId="pago-en-proceso"
        />
      )}
      {orden.estado === 'PENDIENTE' && orden.detalleEstado?.startsWith('Pago rechazado') && (
        <Estado
          icono={<XCircle className="h-10 w-10 text-rose-500" />}
          titulo="El pago fue rechazado"
          texto="No se cobró nada. Podés intentar de nuevo con otro medio de pago o cancelar."
          testId="pago-rechazado"
        />
      )}
      {(orden.estado === 'CANCELADA' || orden.estado === 'VENCIDA') && (
        <Estado
          icono={<XCircle className="h-10 w-10 text-slate-400" />}
          titulo={orden.estado === 'VENCIDA' ? 'El pago venció' : 'Pago cancelado'}
          texto="No se cobró nada. Si querés, podés iniciar un nuevo pago."
          testId="pago-cancelado"
        />
      )}
      {orden.estado === 'REQUIERE_REVISION' && (
        <Estado
          icono={<AlertTriangle className="h-10 w-10 text-amber-500" />}
          titulo="Recibimos tu pago, pero hay que revisarlo"
          texto="El pago se cobró pero no pudimos acreditarlo automáticamente (por ejemplo, el período ya figuraba como pagado). La administración lo va a revisar y, si corresponde, te devuelve el dinero."
          testId="pago-revision"
        />
      )}

      <Acciones>
        {orden.estado === 'PENDIENTE' && orden.urlPago && (
          <>
            <Button variant="outline" onClick={() => void handleCancelar()} disabled={cancelar.isPending}>
              Cancelar pago
            </Button>
            <Button onClick={() => irAPagar(orden.urlPago!)}>
              <RotateCcw size={16} /> Volver a la pasarela
            </Button>
          </>
        )}
        {orden.estado !== 'PENDIENTE' && (
          <Link to={destino.ruta}>
            <Button data-testid="pago-ir-a-destino">{destino.texto}</Button>
          </Link>
        )}
      </Acciones>
    </Contenedor>
  );
}

function Contenedor({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resultado del pago</h1>
      </header>
      <Card className="mx-auto max-w-xl p-8">{children}</Card>
    </div>
  );
}

function Estado({
  icono,
  titulo,
  texto,
  testId,
}: {
  icono: ReactNode;
  titulo: string;
  texto: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center" data-testid={testId}>
      {icono}
      <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
      <p className="text-sm text-slate-600">{texto}</p>
    </div>
  );
}

function Acciones({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>;
}
