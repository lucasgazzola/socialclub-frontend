import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { useDesactivarSocio } from '../hooks/useDesactivarSocio';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import type { Socio } from '../types';

interface SociosTableProps {
  socios: Socio[];
}

/** Tabla de presentación de socios (componente "tonto", sin lógica de datos). */
export function SociosTable({ socios }: SociosTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { mutate: desactivar, isPending } = useDesactivarSocio();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');

=======
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
=======
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');
>>>>>>> 0d96dd6 (feat[US-13]: editar socio)
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
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {socios.map((socio) => (
            <tr key={socio.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-900">
                {socio.apellido}, {socio.nombre}
              </td>
              <td className="px-4 py-3 text-slate-600">{socio.dni}</td>
              <td className="px-4 py-3 text-slate-600">{socio.email ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{socio.categoria?.nombre ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    socio.activo
                      ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                      : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                  }
                >
                  {socio.activo ? 'Alta' : 'Baja'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
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
    </div>
  );
}