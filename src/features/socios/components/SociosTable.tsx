import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Pencil, UserCheck, UserMinus } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useDesactivarSocio } from '../hooks/useDesactivarSocio';
import { useReactivarSocio } from '../hooks/useReactivarSocio';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { ModalCobroCuotaSocio } from '@/features/pagos/components/ModalCobroCuotaSocio';
import { useCuotasPendientesSocio } from '@/features/pagos/hooks/useCuotasPendientesSocio';
import type { Socio } from '../types';

interface SociosTableProps {
  socios: Socio[];
}

function SocioEstadoCell({ socio }: { socio: Socio }) {
  return (
    <Badge variant={socio.activo ? 'success' : 'danger'}>
      {socio.activo ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}

function SocioCuentaCell({
  socio,
  puedeCobrar,
  onCobrar,
}: {
  socio: Socio;
  puedeCobrar: boolean;
  onCobrar: () => void;
}) {
  const { data, isLoading, isError } = useCuotasPendientesSocio(socio.id);

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
    return <Badge variant="success">Al día</Badge>;
  }

  const label = `Moroso (${data.cuotasPendientes.length})`;

  if (puedeCobrar) {
    return (
      <button
        type="button"
        onClick={onCobrar}
        title="Cobrar cuotas pendientes"
        className="cursor-pointer transition-opacity hover:opacity-80"
      >
        <Badge variant="warning">{label}</Badge>
      </button>
    );
  }

  return <Badge variant="warning">{label}</Badge>;
}

export function SociosTable({ socios }: SociosTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [socioCobro, setSocioCobro] = useState<Socio | null>(null);
  const { mutate: desactivar, isPending } = useDesactivarSocio();
  const { mutate: reactivar, isPending: isReactivando } = useReactivarSocio();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeGestionar = Boolean(
    usuario?.roles.some((r) => r === 'ADMIN' || r === 'COLABORADOR'),
  );
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
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
        No se encontraron resultados
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Apellido y nombre</th>
              <th className="px-5 py-3.5">DNI</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Categoría</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Estado de cuenta</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sociosOrdenados.map((socio) => (
              <tr key={socio.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {socio.apellido}, {socio.nombre}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums">{socio.dni}</td>
                <td className="px-5 py-3.5 text-slate-600">{socio.email ?? '—'}</td>
                <td className="px-5 py-3.5 text-slate-600">{socio.categoria?.nombre ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <SocioEstadoCell socio={socio} />
                </td>
                <td className="px-5 py-3.5">
                  <SocioCuentaCell
                    socio={socio}
                    puedeCobrar={puedeCobrar}
                    onCobrar={() => setSocioCobro(socio)}
                  />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
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
                    {puedeGestionar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(ROUTES.editarSocio(socio.id))}
                      >
                        <Pencil size={14} />
                        Editar
                      </Button>
                    )}
                    {puedeGestionar && !socio.activo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Dar de alta (Re-asociar)"
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        disabled={isReactivando}
                        onClick={() => reactivar(socio.id)}
                      >
                        <UserCheck size={14} />
                        Dar de alta
                      </Button>
                    )}
                    {puedeGestionar && socio.activo && (
                      confirmId === socio.id ? (
                        <div className="flex items-center gap-1.5">
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
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => {
                            setConfirmId(socio.id);
                          }}
                        >
                          <UserMinus size={14} />
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
      </div>

      <ModalCobroCuotaSocio
        open={Boolean(socioCobro)}
        onClose={() => setSocioCobro(null)}
        socio={socioCobro}
      />
    </div>
  );
}