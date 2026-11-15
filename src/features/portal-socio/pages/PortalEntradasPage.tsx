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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entradas.map((entrada) => (
            <PortalSurface key={entrada.id} variant="pass" className="flex flex-col justify-between">
              {/* Cabecera del pase */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-blue-400/25 bg-blue-500/12 text-blue-400">
                    <Ticket size={15} />
                  </span>
                  <PortalTag tone="info" dot>
                    Pase Digital
                  </PortalTag>
                </div>

                <h2 className="mt-3.5 text-base font-semibold tracking-[-0.02em] text-white">
                  {entrada.evento?.nombre ?? 'Evento'}
                </h2>
              </div>

              {/* Corte perforado del ticket */}
              <div className="border-t border-dashed border-blue-400/25 px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center rounded-[5px] border border-slate-300/[0.10] bg-[#060911] p-4">
                  <div className="rounded-[4px] bg-white p-2">
                    <PortalQRCode value={entrada.token} size={148} />
                  </div>
                  <p className="mt-2.5 break-all text-center font-mono text-[11px] text-slate-400 tabular-nums">
                    {entrada.token}
                  </p>
                </div>
              </div>

              {/* Acciones de descarga */}
              <div className="flex gap-2 border-t border-slate-300/[0.08] px-4 py-3.5 sm:px-5">
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
