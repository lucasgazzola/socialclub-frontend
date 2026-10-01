import { Download, Ticket } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { QRCode } from '../components/QRCode';
import { useMisEntradas } from '../hooks/useEntradas';
import type { Entrada } from '../types';

function descargarQR(entrada: Entrada) {
  void import('qrcode').then(({ default: QRCodeLib }) =>
    QRCodeLib.toDataURL(entrada.token, { width: 300, margin: 2 }).then((url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `entrada-${entrada.token.slice(0, 8)}.png`;
      link.click();
    }),
  );
}

export function MisEntradasPage() {
  const { data: entradas, isLoading, isError } = useMisEntradas();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis entradas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visualizá y descargá tus códigos QR de acceso.
        </p>
      </header>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar tus entradas.
        </div>
      ) : entradas?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entradas.map((entrada) => (
            <Card key={entrada.id} className="flex flex-col items-center p-5 text-center">
              <Ticket size={20} className="mb-2 text-brand-700" />
              <h2 className="font-semibold text-slate-900">{entrada.evento?.nombre ?? 'Evento'}</h2>
              <QRCode value={entrada.token} size={180} />
              <p className="mt-3 break-all font-mono text-xs text-slate-500">{entrada.token}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => descargarQR(entrada)}>
                <Download size={14} /> Descargar QR
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Todavía no tenés entradas adquiridas.
        </div>
      )}
    </div>
  );
}
