import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, QrCode, XCircle } from 'lucide-react';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { useValidarAcceso } from '../hooks/useEntradas';
import type { ResultadoValidacion } from '../types';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

/**
 * US-31 — Validar acceso mediante lectura de QR.
 *
 * El operador de acceso escanea el QR de la entrada con la cámara (o pega el
 * token manualmente) y el sistema informa si el acceso está permitido.
 */
export function ValidarAccesoPage() {
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [tokenManual, setTokenManual] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const procesandoRef = useRef(false);

  const { mutate, isPending } = useValidarAcceso();

  const validar = useCallback(
    (token: string) => {
      if (!token.trim()) return;
      procesandoRef.current = true;
      mutate(token.trim(), {
        onSuccess: (res) => setResultado(res),
        onSettled: () => {
          procesandoRef.current = false;
        },
      });
    },
    [mutate],
  );

  // Monta el escáner mientras no haya un resultado en pantalla.
  useEffect(() => {
    if (resultado) return;

    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      { fps: 10, qrbox: { width: 240, height: 240 } },
      false,
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (procesandoRef.current) return;
        void scanner.clear().catch(() => undefined);
        validar(decodedText);
      },
      () => undefined, // errores de frame (sin QR): se ignoran
    );

    return () => {
      void scanner.clear().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [resultado, validar]);

  const reiniciar = () => {
    setResultado(null);
    setTokenManual('');
    procesandoRef.current = false;
  };

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <QrCode size={22} /> Validar acceso
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Escaneá el código QR de la entrada para controlar el ingreso al evento.
        </p>
      </header>

      {isPending && (
        <Card className="flex items-center justify-center gap-3 p-8">
          <Spinner /> Validando…
        </Card>
      )}

      {!isPending && resultado && (
        <Card
          className={
            resultado.valido
              ? 'border-green-200 bg-green-50 p-6 text-center'
              : 'border-red-200 bg-red-50 p-6 text-center'
          }
        >
          {resultado.valido ? (
            <CheckCircle2 className="mx-auto text-green-600" size={56} />
          ) : (
            <XCircle className="mx-auto text-red-600" size={56} />
          )}
          <p
            className={cn(
              'mt-3 text-lg font-semibold',
              resultado.valido ? 'text-green-800' : 'text-red-800',
            )}
          >
            {resultado.valido ? 'Acceso permitido' : 'Acceso rechazado'}
          </p>
          <p className="mt-1 text-sm text-slate-600">{resultado.motivo}</p>
          {resultado.entrada && (
            <p className="mt-2 text-sm text-slate-500">
              Evento: <span className="font-medium">{resultado.entrada.evento.nombre}</span>
            </p>
          )}
          <Button className="mt-5 w-full" onClick={reiniciar}>
            Escanear otra entrada
          </Button>
        </Card>
      )}

      {!isPending && !resultado && (
        <div className="space-y-4">
          <Card className="p-4">
            <div id={SCANNER_ELEMENT_ID} />
          </Card>

          <Card className="p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              ¿No podés escanear? Ingresá el token manualmente
            </p>
            <div className="flex gap-2">
              <Input
                id="tokenManual"
                value={tokenManual}
                onChange={(e) => setTokenManual(e.target.value)}
                placeholder="Token de la entrada"
              />
              <Button onClick={() => validar(tokenManual)} disabled={!tokenManual.trim()}>
                Validar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

