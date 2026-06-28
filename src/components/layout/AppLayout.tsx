import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RolNombre } from '@/features/auth/types';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: RolNombre[];
}

const navItems: NavItem[] = [
  { to: ROUTES.dashboard, label: 'Inicio', icon: LayoutDashboard },
  { to: ROUTES.socios, label: 'Socios', icon: Users, roles: ['ADMIN', 'COLABORADOR'] },
  { to: ROUTES.usuarios, label: 'Usuarios', icon: ShieldCheck, roles: ['ADMIN'] },
];

/** Estructura visual de las páginas autenticadas: sidebar + contenido. */
export function AppLayout() {
  const { usuario, logout } = useAuth();

  const itemsVisibles = navItems.filter(
    (item) => !item.roles || item.roles.some((rol) => usuario?.roles.includes(rol)),
  );

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6">
        <div>
          <div className="mb-8 px-2">
            <p className="text-lg font-semibold text-brand-700">SocialClub</p>
            <p className="text-xs text-slate-500">Panel de gestión</p>
          </div>
          <nav className="space-y-1">
            {itemsVisibles.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.dashboard}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="px-2 text-sm font-medium text-slate-700">
            {usuario?.nombre} {usuario?.apellido}
          </p>
          <p className="px-2 text-xs text-slate-500">{usuario?.email}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={() => void logout()}>
            <LogOut size={16} />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
