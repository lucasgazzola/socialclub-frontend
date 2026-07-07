import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import type { Socio } from '../types';

interface SociosTableProps {
  socios: Socio[];
}

export function SociosTable({ socios }: SociosTableProps) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');
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
            {esAdmin && <th className="px-4 py-3 font-medium">Acciones</th>}
            {esAdmin && <th className="px-4 py-3 font-medium">Acciones</th>}
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
              {esAdmin && (
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(ROUTES.sociosEditar.replace(':id', String(socio.id)))}
                  >
                    <Pencil size={14} />
                    Editar
                  </Button>
                </td>
              )}
              {esAdmin && (
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(ROUTES.sociosEditar.replace(':id', String(socio.id)))}
                  >
                    <Pencil size={14} />
                    Editar
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}