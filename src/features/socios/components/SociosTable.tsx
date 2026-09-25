import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Coins, Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { useDesactivarSocio } from '../hooks/useDesactivarSocio';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { ModalCobroCuotaSocio } from '@/features/pagos/components/ModalCobroCuotaSocio';
import { useCuotasPendientesSocio } from '@/features/pagos/hooks/useCuotasPendientesSocio';
import type { Socio } from '../types';

interface SociosTableProps {
  socios: Socio[];
}

function SocioEstadoCell({
  socio,
  puedeCobrar,
  onCobrar,
}: {
  socio: Socio;
  puedeCobrar: boolean;
  onCobrar: () => void;
}) {
  const { data, isLoading, isError } = useCuotasPendientesSocio(
    socio.activo ? socio.id : null,
  );

  if (!socio.activo) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Baja
      </span>
    );
  }

  if (isLoading) {
    return (
      <span
        data-testid={`estado-cuota-loading-${socio.id}`}
        className="inline-block h-5 w-16 animate-pulse rounded-full bg-slate-100"
      />
    );
  }

  if (isError || !data) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  if (data.estadoFinanciero === 'AL_DIA' || data.cuotasPendientes.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={12} className="text-emerald-600" />
        Al día
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={puedeCobrar ? onCobrar : undefined}
      title={puedeCobrar ? 'Cobrar cuotas pendientes' : undefined}
      className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 transition ${
        puedeCobrar ? 'hover:bg-amber-100 hover:border-amber-300 cursor-pointer' : ''
      }`}
    >
      <AlertTriangle size={12} className="text-amber-600" />
      Moroso ({data.cuotasPendientes.length})
    </button>
  );
}

export function SociosTable({ socios }: SociosTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [socioCobro, setSocioCobro] = useState<Socio | null>(null);
  const { mutate: desactivar, isPending } = useDesactivarSocio();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');
  const puedeCobrar = Boolean(usuario?.roles.some((r) => r === 'ADMIN' || r === 'COLABORADOR'));

  const sociosOrdenados = useMemo(() => {
    return [...socios].sort((a, b) => {
      const timeA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
      const timeB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
      return timeB - timeA;
    });
  }, [socios]);

  if (socios.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No se encontraron resultados
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Apellido y nombre</th>
            <th className="px-4 py-3 font-medium">DNI</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sociosOrdenados.map((socio) => (
            <tr key={socio.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-900">
                {socio.apellido}, {socio.nombre}
              </td>
              <td className="px-4 py-3 text-slate-600">{socio.dni}</td>
              <td className="px-4 py-3 text-slate-600">{socio.email ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{socio.categoria?.nombre ?? '—'}</td>
              <td className="px-4 py-3">
                <SocioEstadoCell
                  socio={socio}
                  puedeCobrar={puedeCobrar}
                  onCobrar={() => setSocioCobro(socio)}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {puedeCobrar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSocioCobro(socio)}
                    >
                      <Coins size={14} />
                      Cobrar
                    </Button>
                  )}
                  {esAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(ROUTES.sociosEditar.replace(':id', String(socio.id)))}
                    >
                      <Pencil size={14} />
                      Editar
                    </Button>
                  )}
                  {socio.activo && (
                    confirmId === socio.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">¿Confirmar baja?</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            desactivar(socio.id);
                            setConfirmId(null);
                          }}
                        >
                          Sí
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmId(socio.id)}
                      >
                        Dar de baja
                      </Button>
                    )
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ModalCobroCuotaSocio
        open={Boolean(socioCobro)}
        onClose={() => setSocioCobro(null)}
        socio={socioCobro}
      />
    </div>
  );
}