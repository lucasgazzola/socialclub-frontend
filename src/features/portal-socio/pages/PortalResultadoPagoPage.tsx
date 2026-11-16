import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { irAPagar, useCancelarOrden, useConfirmarOrden } from '@/features/pasarela/hooks/usePasarela';
import type { OrdenPago } from '@/features/pasarela/types';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalSpinner,
  PortalSurface,
  PortalTitleBar,
} from '../components/PortalUI';

const REINTENTOS = 5;
const ESPERA_MS = 3000;

const DESTINO: Record<OrdenPago['concepto'], { ruta: string; texto: string }> = {
  CUOTA_SOCIAL: { ruta: ROUTES.misCuotas, texto: 'Ver mis cuotas' },
  CUOTA_DEPORTIVA: { ruta: ROUTES.misCuotas, texto: 'Ver mis cuotas' },
  ENTRADAS: { ruta: ROUTES.misEntradas, texto: 'Ver mis entradas' },
  RESERVA: { ruta: ROUTES.misReservas, texto: 'Ver mis reservas' },
};

export function PortalResultadoPagoPage() {
  const [params] = useSearchParams();
  const referencia = params.get('referencia');
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
          icono={<AlertTriangle className="h-9 w-9 text-amber-300" />}
          titulo="No encontramos el pago"
          texto="El enlace no contiene la referencia de una orden de pago."
        />
        <Acciones>
          <Link
            to={ROUTES.miClub}
            className="inline-flex h-9 items-center rounded-[2px] border border-slate-300/[0.16] bg-[#101827] px-4 text-sm font-medium text-slate-100 hover:border-blue-400/40"
          >
            Ir al inicio
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
            icono={<AlertTriangle className="h-9 w-9 text-amber-300" />}
            titulo="No pudimos verificar el pago"
            texto={confirmar.error instanceof Error ? confirmar.error.message : 'Intentá nuevamente.'}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-sm text-slate-400">
            <PortalSpinner />
            <span>Verificando el pago…</span>
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
          icono={<CheckCircle2 className="h-10 w-10 text-emerald-400" />}
          titulo="¡Pago aprobado!"
          texto={`${orden.descripcion} · ${monto}`}
          testId="pago-aprobado"
        />
      )}
      {orden.estado === 'PENDIENTE' && !orden.detalleEstado && (
        <Estado
          icono={<Clock className="h-10 w-10 text-amber-300" />}
          titulo="El pago todavía no se completó"
          texto={`${orden.descripcion} · ${monto}. Podés volver a la pasarela para terminarlo.`}
          testId="pago-pendiente"
        />
      )}
      {orden.estado === 'PENDIENTE' && orden.detalleEstado?.startsWith('Pago en proceso') && (
        <Estado
          icono={<Clock className="h-10 w-10 text-amber-300" />}
          titulo="El pago está en proceso"
          texto="Mercado Pago todavía lo está revisando. Te avisamos aquí en cuanto se acredite."
          testId="pago-en-proceso"
        />
      )}
      {orden.estado === 'PENDIENTE' && orden.detalleEstado?.startsWith('Pago rechazado') && (
        <Estado
          icono={<XCircle className="h-10 w-10 text-rose-400" />}
          titulo="El pago fue rechazado"
          texto="No se realizó ningún cobro. Podés reintentar con otro medio de pago o cancelar."
          testId="pago-rechazado"
        />
      )}
      {(orden.estado === 'CANCELADA' || orden.estado === 'VENCIDA') && (
        <Estado
          icono={<XCircle className="h-10 w-10 text-slate-400" />}
          titulo={orden.estado === 'VENCIDA' ? 'El pago venció' : 'Pago cancelado'}
          texto="No se realizó ningún cobro. Podés iniciar un nuevo pago cuando quieras."
          testId="pago-cancelado"
        />
      )}
      {orden.estado === 'REQUIERE_REVISION' && (
        <Estado
          icono={<AlertTriangle className="h-10 w-10 text-amber-300" />}
          titulo="Recibimos tu pago, pero requiere revisión"
          texto="El pago se acreditó pero no pudimos aplicarlo automáticamente. La administración lo revisará."
          testId="pago-revision"
        />
      )}

      <Acciones>
        {orden.estado === 'PENDIENTE' && orden.urlPago && (
          <>
            <PortalButton
              variant="secondary"
              onClick={() => void handleCancelar()}
              disabled={cancelar.isPending}
            >
              Cancelar pago
            </PortalButton>
            <PortalButton variant="primary" onClick={() => irAPagar(orden.urlPago!)}>
              <RotateCcw size={15} /> Volver a la pasarela
            </PortalButton>
          </>
        )}
        {orden.estado !== 'PENDIENTE' && (
          <Link
            to={destino.ruta}
            data-testid="pago-ir-a-destino"
            className="inline-flex h-10 items-center rounded-[2px] border border-blue-400/35 bg-blue-600 px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-blue-500"
          >
            {destino.texto}
          </Link>
        )}
      </Acciones>
    </Contenedor>
  );
}

function Contenedor({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PortalTitleBar title="Resultado del pago" />
      <PortalSurface className="mx-auto max-w-xl p-6 sm:p-8">{children}</PortalSurface>
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
      <h2 className="text-lg font-semibold text-white">{titulo}</h2>
      <p className="text-sm text-slate-300 tabular-nums">{texto}</p>
    </div>
  );
}

function Acciones({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>;
}
