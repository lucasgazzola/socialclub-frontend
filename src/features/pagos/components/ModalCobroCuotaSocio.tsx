import { useEffect, useState } from 'react';
import { Coins, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Modal, Select, Spinner } from '@/components/ui';
import { EstadoFinancieroBadge } from './EstadoFinancieroBadge';
import { useCuotasPendientesSocio } from '../hooks/useCuotasPendientesSocio';
import { useRegistrarPagoSocio } from '../hooks/useRegistrarPagoSocio';
import {
  METODOS_PAGO_SECRETARIA,
  pagoSecretariaSchema,
} from '../schemas/pagoSecretaria.schema';
import type { MetodoPagoSecretaria } from '../types';

interface SocioBasico {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
}

interface ModalCobroCuotaSocioProps {
  open: boolean;
  onClose: () => void;
  socio: SocioBasico | null;
}

export function ModalCobroCuotaSocio({
  open,
  onClose,
  socio,
}: ModalCobroCuotaSocioProps) {
  const socioId = socio?.id;

  const {
    data: cuotasData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCuotasPendientesSocio(open ? socioId : null);

  const registrarPagoMutation = useRegistrarPagoSocio(socioId);

  const [selectedPeriodos, setSelectedPeriodos] = useState<string[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoSecretaria | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Al abrir un socio nuevo o abrir el modal, reseteamos el formulario
  useEffect(() => {
    if (open && socio) {
      setSelectedPeriodos([]);
      setMetodoPago('');
      setObservaciones('');
      setValidationError(null);
    }
  }, [open, socio]);

  const cuotasPendientes = cuotasData?.cuotasPendientes ?? [];

  const handleTogglePeriodo = (periodo: string) => {
    setValidationError(null);
    setSelectedPeriodos((prev) =>
      prev.includes(periodo) ? prev.filter((p) => p !== periodo) : [...prev, periodo],
    );
  };

  const handleSelectAll = () => {
    setValidationError(null);
    setSelectedPeriodos(cuotasPendientes.map((c) => c.periodo));
  };

  const handleDeselectAll = () => {
    setSelectedPeriodos([]);
  };

  const totalSeleccionado = cuotasPendientes
    .filter((c) => selectedPeriodos.includes(c.periodo))
    .reduce((sum, c) => sum + c.monto, 0);

  const handleConfirmarCobro = async () => {
    const validacion = pagoSecretariaSchema.safeParse({
      periodos: selectedPeriodos,
      metodoPago,
      observaciones: observaciones.trim() || undefined,
    });

    if (!validacion.success) {
      const primerError = validacion.error.issues[0]?.message;
      setValidationError(primerError ?? 'Por favor verificá los datos ingresados.');
      return;
    }

    try {
      await registrarPagoMutation.mutateAsync(validacion.data);
      onClose();
    } catch {
      // El error ya es manejado con toast.error en el hook useRegistrarPagoSocio
    }
  };

  const handleClose = () => {
    if (!registrarPagoMutation.isPending) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Registrar cobro de cuota social"
      description="Cobro y actualización del estado de deuda por secretaría."
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Ficha rápida del socio */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Coins size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {cuotasData?.socioNombre || (socio ? `${socio.apellido}, ${socio.nombre}` : 'Socio')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  DNI: <span className="text-slate-700 font-semibold">{cuotasData?.dni || socio?.dni || '—'}</span>
                  {cuotasData?.categoria ? (
                    <>
                      {' · '}Categoría: <span className="text-slate-700 font-semibold">{cuotasData.categoria}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            {cuotasData && (
              <EstadoFinancieroBadge
                estado={cuotasData.estadoFinanciero}
                cuotasPendientesCount={cuotasPendientes.length}
              />
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Spinner className="h-8 w-8 text-brand-600 mb-3" />
            <p className="text-sm">Consultando cuotas pendientes del socio...</p>
          </div>
        )}

        {/* Estado de error */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">No se pudo cargar la información de cuotas</p>
                <p className="mt-1 text-xs">
                  {error instanceof Error ? error.message : 'Ocurrió un error inesperado al consultar la API.'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => void refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Socio Al Día: sin cuotas pendientes */}
        {!isLoading && !isError && cuotasPendientes.length === 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-base font-semibold text-emerald-900">¡Socio al día!</h4>
            <p className="mt-1 text-sm text-emerald-700">
              Este socio no registra cuotas sociales pendientes de cobro en el sistema.
            </p>
            <div className="mt-6">
              <Button variant="secondary" onClick={onClose}>
                Entendido
              </Button>
            </div>
          </div>
        )}

        {/* Socio con Cuotas Pendientes */}
        {!isLoading && !isError && cuotasPendientes.length > 0 && (
          <div className="space-y-5">
            {/* Listado de cuotas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">
                  Cuotas pendientes ({cuotasPendientes.length})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition"
                  >
                    Seleccionar todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 transition"
                  >
                    Deseleccionar todas
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cuotasPendientes.map((cuota) => {
                  const isSelected = selectedPeriodos.includes(cuota.periodo);
                  return (
                    <label
                      key={cuota.periodo}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/40 text-brand-950 font-medium'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePeriodo(cuota.periodo)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <p className="text-sm font-semibold">Período: {cuota.periodo}</p>
                          <p className="text-xs text-slate-500">{cuota.categoriaNombre}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        ${cuota.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Opciones de Cobro */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200">
              <div>
                <label
                  htmlFor="select-metodo-pago"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Método de pago
                </label>
                <Select
                  id="select-metodo-pago"
                  value={metodoPago}
                  onChange={(e) => {
                    setValidationError(null);
                    setMetodoPago(e.target.value as MetodoPagoSecretaria);
                  }}
                >
                  <option value="" disabled>
                    Seleccionar método de pago
                  </option>
                  {METODOS_PAGO_SECRETARIA.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="input-observaciones"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Observaciones / Recibo (opcional)
                </label>
                <input
                  id="input-observaciones"
                  type="text"
                  placeholder="Ej: Cobro en ventanilla, recibo 001"
                  value={observaciones}
                  maxLength={255}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            {/* Error de validación */}
            {validationError && (
              <p className="text-xs font-medium text-red-600">{validationError}</p>
            )}

            {/* Resumen del cobro y acciones */}
            <div className="rounded-xl bg-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  Seleccionadas:{' '}
                  <span className="font-semibold text-slate-700">
                    {selectedPeriodos.length} de {cuotasPendientes.length}
                  </span>
                </p>
                <p className="text-lg font-bold text-slate-900">
                  Total a cobrar:{' '}
                  <span className="text-brand-700">
                    ${totalSeleccionado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={registrarPagoMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmarCobro}
                  disabled={selectedPeriodos.length === 0 || registrarPagoMutation.isPending}
                >
                  {registrarPagoMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      Registrando...
                    </span>
                  ) : (
                    `Confirmar cobro ($${totalSeleccionado.toLocaleString('es-AR')})`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
