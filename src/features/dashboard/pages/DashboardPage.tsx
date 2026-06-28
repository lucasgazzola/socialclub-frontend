import { Users, ShieldCheck, ScrollText } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';

const modulos = [
  {
    titulo: 'Socios',
    descripcion: 'Alta, edición, baja y consulta de socios del club.',
    icon: Users,
  },
  {
    titulo: 'Usuarios',
    descripcion: 'Gestión de usuarios administrativos y sus roles.',
    icon: ShieldCheck,
  },
  {
    titulo: 'Auditoría',
    descripcion: 'Registro inalterable de todas las operaciones del sistema.',
    icon: ScrollText,
  },
];

export function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Hola, {usuario?.nombre ?? usuario?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bienvenido al panel de gestión de SocialClub.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map(({ titulo, descripcion, icon: Icon }) => (
          <Card key={titulo} className="p-5">
            <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
              <Icon size={20} />
            </div>
            <h2 className="font-medium text-slate-900">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
