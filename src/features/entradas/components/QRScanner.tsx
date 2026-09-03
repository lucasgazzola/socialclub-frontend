import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, Upload, Keyboard, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

interface QRScannerProps {
  onScan: (token: string) => void;
  isScanningPaused?: boolean;
}

export function QRScanner({ onScan, isScanningPaused = false }: QRScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTokenRef = useRef<string>('');

  // Cargar cámaras disponibles
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Cámara ${d.id}` })));
          setSelectedCameraId(devices[devices.length - 1].id); // Usar preferentemente la trasera
        } else {
          setCameraError('No se detectaron cámaras en este dispositivo.');
          setMode('manual');
        }
      })
      .catch((err) => {
        console.warn('Error al obtener cámaras:', err);
        setCameraError('No se pudo acceder a la cámara o se denegaron los permisos.');
      });
  }, []);

  // Iniciar / detener el scanner cuando cambie el modo o la cámara seleccionada
  useEffect(() => {
    if (mode !== 'camera' || !selectedCameraId || isScanningPaused) {
      stopScanner();
      return;
    }

    startScanner(selectedCameraId);

    return () => {
      stopScanner();
    };
  }, [mode, selectedCameraId, isScanningPaused]);

  const startScanner = async (cameraId: string) => {
    try {
      setCameraError(null);

      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode('qr-reader-container', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      if (isScanningRef.current) {
        await html5QrcodeRef.current.stop();
        isScanningRef.current = false;
      }

      await html5QrcodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Evitar múltiples disparos seguidos del mismo QR
          const trimmed = decodedText.trim();
          if (trimmed && trimmed !== lastScannedTokenRef.current) {
            lastScannedTokenRef.current = trimmed;
            onScan(trimmed);

            // Resetear cooldown después de 2 segundos
            setTimeout(() => {
              lastScannedTokenRef.current = '';
            }, 2000);
          }
        },
        () => {
          // Callback de error por frame no decodificado
        },
      );

      isScanningRef.current = true;
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Error al iniciar escáner de QR:', err);
      setIsCameraActive(false);
      setCameraError('Error al iniciar la cámara. Verifica los permisos del navegador.');
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current && isScanningRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.warn('Error al detener escáner:', err);
      } finally {
        isScanningRef.current = false;
        setIsCameraActive(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    onScan(manualToken.trim());
    setManualToken('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-file-temp', false);
      const decodedText = await html5Qrcode.scanFile(file, true);
      if (decodedText) {
        onScan(decodedText.trim());
      }
    } catch (err) {
      alert('No se pudo encontrar un código QR en la imagen proporcionada.');
    }
  };

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  return (
    <Card className="p-6">
      {/* Pestañas de Modo */}
      <div className="mb-6 flex gap-2 border-b border-slate-200 pb-4">
        <Button
          type="button"
          variant={mode === 'camera' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('camera')}
        >
          <Camera size={16} className="mr-2" />
          Escáner de Cámara
        </Button>
        <Button
          type="button"
          variant={mode === 'manual' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('manual')}
        >
          <Keyboard size={16} className="mr-2" />
          Ingreso Manual / Archivo
        </Button>
      </div>

      {mode === 'camera' ? (
        <div className="flex flex-col items-center">
          {cameraError ? (
            <div className="my-6 rounded-lg bg-red-50 p-4 text-center text-red-700">
              <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
              <p className="font-medium">{cameraError}</p>
              <p className="mt-1 text-xs text-red-600">
                Podés utilizar el ingreso manual por código de token.
              </p>
            </div>
          ) : (
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-300 bg-black">
              <div id="qr-reader-container" className="w-full" />
              {isScanningPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                  <p className="font-semibold">Escaneo pausado</p>
                </div>
              )}
            </div>
          )}

          {cameras.length > 1 && mode === 'camera' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={toggleCamera}
              disabled={!isCameraActive}
            >
              <RefreshCw size={14} className="mr-2" />
              Cambiar cámara ({cameras.find((c) => c.id === selectedCameraId)?.label || 'Cámara'})
            </Button>
          )}

          <p className="mt-4 text-xs text-slate-500 text-center">
            Apuntá la cámara al código QR de la entrada. El escaneo es automático.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Input
                label="Token UUID de la Entrada"
                placeholder="Ej: 550e8400-e29b-41d4-a716-446655440000"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                autoFocus
              />
              <p className="mt-1 text-xs text-slate-500">Podés escribir o pegar el token extraído del QR.</p>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={!manualToken.trim()}>
              Validar Token Manualmente
            </Button>
          </form>


          <div className="relative flex items-center justify-center border-t border-slate-200 pt-4">
            <span className="bg-white px-2 text-xs font-medium text-slate-400">O subir imagen QR</span>
          </div>

          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50/50">
              <Upload size={24} className="mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Subir imagen con QR</span>
              <span className="text-xs text-slate-400">PNG, JPG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <div id="qr-reader-file-temp" className="hidden" />
          </div>
        </div>
      )}
    </Card>
  );
}
