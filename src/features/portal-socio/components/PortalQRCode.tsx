import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface PortalQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Generador QR exclusivo del Portal de Socios (sin importar componentes de Admin).
 */
export function PortalQRCode({ value, size = 156, className }: PortalQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    void QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  }, [value, size]);

  return <canvas ref={canvasRef} className={className} aria-label={`QR: ${value}`} />;
}
