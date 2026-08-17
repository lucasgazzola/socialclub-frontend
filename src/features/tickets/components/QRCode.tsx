import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number; //Tamaño del QR en pixeles. En BuyTicketsPage.tsx esta definido en 160 px.
  className?: string;
}

/**
 * Componente que genera un codigo QR a partir de un valor (token de entrada) usando qrcode.js.
 * El QR se dibuja en un canvas y se muestra en pantalla.
 */

export function QRCode({ value, size = 160, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null); //Permite dibujar el QR

  useEffect(() => {
    if (!canvasRef.current) return;
    void QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M', // Nivel de correccion de errores para que sea legible.
    });
  }, [value, size]);

  return <canvas ref={canvasRef} className={className} aria-label={`QR: ${value}`} />;
}