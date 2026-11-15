import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Globe,
  LayoutDashboard,
  LogOut,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClubLogo } from '@/components/ui';
import { CLUB } from '@/config/club';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES, esDeGestion } from '@/routes/paths';
import { itemsDelPortal, type ItemPortal } from './portal.items';
import { cn } from '@/lib/utils/cn';

/** Las compras de entradas viven bajo Eventos, pero pertenecen a la sección Entradas. */
function estaActivo(item: ItemPortal, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  if (item.to === ROUTES.misEntradas && pathname.startsWith(ROUTES.eventos)) return true;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/**
 * TASK-60 — Estructura de Mi club (autogestión de socios y participantes).
 * Barra superior en escritorio, barra inferior fija en el celular (patrón de
 * app) y menú de cuenta con el acceso al panel para quien tiene un rol de gestión.
 */
export function PortalLayout() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const esOFueSocio = Boolean(usuario?.persona?.membresias?.length);
  const items = itemsDelPortal(esOFueSocio);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={ROUTES.miClub} className="flex min-w-0 items-center gap-2.5">
            <ClubLogo size={36} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold tracking-tight text-slate-900">
                {CLUB.nombreCorto}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                Mi club
              </span>
            </span>
          </Link>

          <nav aria-label="Secciones de Mi club" className="hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              const activo = estaActivo(item, pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={activo ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    activo
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <item.icon size={16} strokeWidth={2} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <MenuCuenta />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
        <Outlet />
      </main>

      <nav
        aria-label="Secciones de Mi club"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {items.map((item) => {
            const activo = estaActivo(item, pathname);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={activo ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-semibold transition-colors',
                    activo ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      activo && 'bg-brand-50',
                    )}
                  >
                    <item.icon size={20} strokeWidth={activo ? 2.3 : 1.9} aria-hidden />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Avatar con el menú de la cuenta: perfil, panel (si corresponde), sitio del club y salir. */
function MenuCuenta() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setAbierto(false), [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const alClickear = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alClickear);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClickear);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  if (!usuario) return null;

  const iniciales =
    `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase() ||
    usuario.email[0].toUpperCase();

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de la cuenta"
        className="flex items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-900 text-xs font-bold text-white">
          {iniciales}
        </span>
        <ChevronDown size={14} className="text-slate-500" aria-hidden />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10"
        >
          <div className="border-b border-slate-100 px-4 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email}
            </p>
            <p className="truncate text-xs text-slate-500">{usuario.email}</p>
          </div>
          <ItemMenu to={ROUTES.perfil} icon={User} label="Mi perfil" />
          {esDeGestion(usuario.roles) && (
            <ItemMenu to={ROUTES.dashboard} icon={LayoutDashboard} label="Ir al panel de gestión" />
          )}
          <ItemMenu to={ROUTES.inicio} icon={Globe} label="Sitio del club" />
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              // Primero a la landing: así el login no «recuerda» la ruta del usuario que salió.
              navigate(ROUTES.inicio, { replace: true });
              void logout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={16} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function ItemMenu({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon size={16} className="text-slate-500" aria-hidden />
      {label}
    </Link>
  );
}
