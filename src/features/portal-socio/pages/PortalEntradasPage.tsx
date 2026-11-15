import { Download, FileText, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMisEntradas } from '@/features/entradas/hooks/useEntradas';
import { descargarEntradaPdf, descargarQR } from '@/features/entradas/utils/descargarEntradaPdf';
import { ROUTES } from '@/routes/paths';
import { PortalQRCode } from '../components/PortalQRCode';
import {
  PortalButton,
  PortalEmptyState,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

/**
 * Entradas digitales con diseño de ticket afilado obsidian/azul y descarga PDF/PNG.
 */
export function PortalEntradasPage() {
  const navigate = useNavigate();
  const { data: entradas, isLoading, isError } = useMisEntradas();

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Mis entradas"
        summary="Presentá tu pase QR al ingresar o descargá el comprobante PDF sin conexión."
        actions={
          <PortalButton variant="secondary" size="sm" onClick={() => navigate(ROUTES.eventos)}>
            Explorar eventos
          </PortalButton>
        }
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <PortalSpinner />
        </div>
      ) : isError ? (
        <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          No se pudieron cargar tus entradas. Intentá recargar la página.
        </PortalSurface>
      ) : entradas?.length ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {entradas.map((entrada) => (
            <PortalSurface
              key={entrada.id}
              variant="pass"
              className="relative grid grid-cols-1 overflow-hidden sm:grid-cols-[1fr_210px]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-blue-500"
              />

              {/* Cuerpo izquierdo del ticket */}
              <div className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">
                      <Ticket size={13} />
                      Ticket de Acceso
                    </span>
                    <PortalTag tone="info" dot>
                      Pase Digital
                    </PortalTag>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-white">
                    {entrada.evento?.nombre ?? 'Evento'}
                  </h2>
                  <p className="mt-1 font-mono text-[11px] text-slate-400 tabular-nums">
                    Token: {entrada.token}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <PortalButton
                    variant="primary"
                    size="sm"
                    onClick={() => descargarEntradaPdf(entrada)}
                  >
                    <FileText size={14} />
                    Descargar PDF
                  </PortalButton>
                  <PortalButton
                    variant="secondary"
                    size="sm"
                    onClick={() => descargarQR(entrada)}
                  >
                    <Download size={14} />
                    QR PNG
                  </PortalButton>
                </div>
              </div>

              {/* Talón derecho perforado con código QR */}
              <div className="flex flex-col items-center justify-center border-t border-dashed border-blue-400/30 bg-[#04070e]/90 p-5 sm:border-t-0 sm:border-l">
                <div className="rounded-[2px] bg-white p-2">
                  <PortalQRCode value={entrada.token} size={136} />
                </div>
                <span className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Presentar en puerta
                </span>
              </div>
            </PortalSurface>
          ))}
        </div>
      ) : (
        <PortalEmptyState
          icon={<Ticket size={20} />}
          title="Todavía no tenés entradas"
          description="Explorá el calendario del club para adquirir tu entrada digital con QR."
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
