import { useState } from 'react';
import { useMisCuotas } from '../hooks/useMisCuotas';
import { useRegistrarPago } from '../hooks/useRegistrarPago';
import { useHistorialPagos } from '../hooks/useHistorialPagos';
import { EstadoFinancieroBadge } from '../components/EstadoFinancieroBadge';
import { CuotasPendientesList } from '../components/CuotasPendientesList';
import { MockPasarelaPagoModal } from '../components/MockPasarelaPagoModal';
import { Spinner } from '@/components/ui';
import { Coins, History, CreditCard } from 'lucide-react';
import type { MockPagoFormData } from '../schemas/pago.schema';

export function MisCuotasPage() {
  const { data: resumen, isLoading: isLoadingCuotas, isError, error } = useMisCuotas();
  const { data: historial, isLoading: isLoadingHistorial } = useHistorialPagos();
  const registrarPagoMutation = useRegistrarPago();

  const [selectedPeriodos, setSelectedPeriodos] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

  const cuotasPendientes = resumen?.cuotasPendientes ?? [];

  const handleTogglePeriodo = (periodo: string) => {
    setSelectedPeriodos((prev) =>
      prev.includes(periodo) ? prev.filter((p) => p !== periodo) : [...prev, periodo],
    );
  };

  const handleSelectAll = () => {
    setSelectedPeriodos(cuotasPendientes.map((c) => c.periodo));
  };

  const handleDeselectAll = () => {
    setSelectedPeriodos([]);
  };

  const handleConfirmPago = async (formData: MockPagoFormData) => {
    if (selectedPeriodos.length === 0) return;

    await registrarPagoMutation.mutateAsync({
      periodos: selectedPeriodos,
      metodoPago: 'MOCK_TARJETA',
      numeroTarjeta: formData.numeroTarjeta,
      vencimiento: formData.vencimiento,
      cvc: formData.cvc,
      titular: formData.titular,
    });

    setSelectedPeriodos([]);
    setIsModalOpen(false);
  };

  if (isLoadingCuotas) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="font-semibold">Error al cargar la información de cuotas</h3>
        <p className="mt-1 text-sm">
          {error instanceof Error
            ? error.message
            : 'No se pudo obtener el estado de cuotas. Asegurate de tener una membresía activa.'}
        </p>
      </div>
    );
  }

  const selectedCuotasObjects = cuotasPendientes.filter((c) =>
    selectedPeriodos.includes(c.periodo),
  );

  return (
    <div className="space-y-6">
      {/* Header Ficha Socio */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Coins size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{resumen?.socioNombre}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Categoría: <span className="text-slate-700">{resumen?.categoria}</span>
              </p>
            </div>
          </div>

          <EstadoFinancieroBadge
            estado={resumen?.estadoFinanciero ?? 'AL_DIA'}
            cuotasPendientesCount={cuotasPendientes.length}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-y-0 space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('pendientes')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'pendientes'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <CreditCard size={18} />
            Cuotas pendientes ({cuotasPendientes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'historial'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <History size={18} />
            Historial de pagos ({historial?.length ?? 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'pendientes' ? (
        <CuotasPendientesList
          cuotas={cuotasPendientes}
          selectedPeriodos={selectedPeriodos}
          onTogglePeriodo={handleTogglePeriodo}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onPagar={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoadingHistorial ? (
            <div className="p-8 text-center">
              <Spinner />
            </div>
          ) : !historial || historial.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No registrás pagos históricos en el sistema.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID Pago</th>
                  <th className="px-4 py-3">Período Cubierto</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{pago.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{pago.periodo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(pago.fechaPago).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {pago.metodoPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Pasarela */}
      <MockPasarelaPagoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCuotas={selectedCuotasObjects}
        onConfirmPago={handleConfirmPago}
        isLoading={registrarPagoMutation.isPending}
      />
    </div>
  );
}
