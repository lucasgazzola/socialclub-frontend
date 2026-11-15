import { Download, FileText, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { QRCode } from '@/features/entradas/components/QRCode';
import { useMisEntradas } from '@/features/entradas/hooks/useEntradas';
import { descargarEntradaPdf, descargarQR } from '@/features/entradas/utils/descargarEntradaPdf';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalEmptyState,
  PortalPageHeader,
  PortalPanel,
  PortalStatusPill,
} from '../components/PortalUI';

export function PortalEntradasPage() {
  const navigate = useNavigate();
  const { data: entradas, isLoading, isError } = useMisEntradas();

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Mis entradas"
        subtitle="Presentá tu pase digital con QR en el ingreso o descargalo en PDF para llevarlo sin conexión."
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-7 w-7 text-zinc-400" />
        </div>
      ) : isError ? (
        <PortalPanel className="border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
          No se pudieron cargar tus entradas. Intentá recargar la página.
        </PortalPanel>
      ) : entradas?.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entradas.map((entrada) => (
            <PortalPanel
              key={entrada.id}
              variant="pass"
              className="flex flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-sky-400">
                    <Ticket size={16} />
                  </span>
                  <PortalStatusPill tone="info">Acceso Digital</PortalStatusPill>
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-white">
                  {entrada.evento?.nombre ?? 'Evento'}
                </h2>

                {/* Marco de lectura QR de alto contraste */}
                <div className="mt-5 flex flex-col items-center rounded-xl border border-white/[0.08] bg-[#07090d] p-4">
                  <div className="rounded-lg bg-white p-2.5">
                    <QRCode value={entrada.token} size={156} />
                  </div>
                  <p className="mt-3 break-all text-center font-mono text-[11px] text-zinc-500 tabular-nums">
                    {entrada.token}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
                <PortalButton
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => descargarEntradaPdf(entrada)}
                >
                  <FileText size={14} />
                  PDF
                </PortalButton>
                <PortalButton
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => descargarQR(entrada)}
                >
                  <Download size={14} />
                  QR PNG
                </PortalButton>
              </div>
            </PortalPanel>
          ))}
        </div>
      ) : (
        <PortalEmptyState
          icon={<Ticket size={22} />}
          title="Todavía no tenés entradas"
          description="Explorá el calendario de eventos del club para adquirir tu entrada digital con código QR."
          action={
            <PortalButton variant="primary" size="sm" onClick={() => navigate(ROUTES.eventos)}>
              Explorar eventos
            </PortalButton>
          }
        />
      )}
    </div>
  );
}
