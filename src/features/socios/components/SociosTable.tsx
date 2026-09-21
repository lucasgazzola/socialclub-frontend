import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useDesactivarSocio } from '../hooks/useDesactivarSocio';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import type { Socio } from '../types';

interface SociosTableProps {
  socios: Socio[];
}

export function SociosTable({ socios }: SociosTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { mutate: desactivar, isPending } = useDesactivarSocio();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');

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
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {socios.map((socio) => (
              <tr key={socio.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {socio.apellido}, {socio.nombre}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums">{socio.dni}</td>
                <td className="px-5 py-3.5 text-slate-600">{socio.email ?? '—'}</td>
                <td className="px-5 py-3.5 text-slate-600">{socio.categoria?.nombre ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={socio.activo ? 'success' : 'secondary'}>
                    {socio.activo ? 'Alta' : 'Baja'}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
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
      </div>
    </div>
  );
}