import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Coins,
  CreditCard,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  QrCode,
  ShieldCheck,
  User,
  Users,
  UserPlus,
  UserRound,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  Ticket,
  Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClubLogo } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RolNombre } from '@/features/auth/types';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: RolNombre[];
  /** Si está activo, el ítem solo se muestra cuando el usuario NO tiene membresía activa. */
  soloSinMembresia?: boolean;
  /** Roles para los que el ítem no se muestra. */
  ocultarParaRoles?: RolNombre[];
  /** Si está activo, el ítem solo se muestra si el usuario es o fue socio (tiene o tuvo membresías). */
  soloSocioOExSocio?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { to: ROUTES.dashboard, label: 'Inicio', icon: LayoutDashboard },
      { to: ROUTES.perfil, label: 'Mi perfil', icon: User },
    ],
  },
  {
    title: 'Gestión Social',
    items: [
      { to: ROUTES.socios, label: 'Socios', icon: Users, roles: ['ADMIN', 'COLABORADOR'] },
      // US-09: autoservicio del usuario. La secretaría da de alta socios desde Socios (US-12).
      {
        to: ROUTES.hacermeSocio,
        label: 'Hacerme socio',
        icon: UserPlus,
        soloSinMembresia: true,
        ocultarParaRoles: ['ADMIN', 'COLABORADOR', 'DELEGADO'],
      },
      { to: ROUTES.misCuotas, label: 'Mis cuotas', icon: CreditCard, soloSocioOExSocio: true },
      { to: ROUTES.misEntradas, label: 'Mis entradas', icon: Ticket },
      {
        to: ROUTES.participantes,
        label: 'Participantes',
        icon: UserRound,
        roles: ['ADMIN', 'COLABORADOR', 'DELEGADO'],
      },
      { to: ROUTES.disciplinas, label: 'Disciplinas', icon: Dumbbell, roles: ['ADMIN', 'COLABORADOR'] },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { to: ROUTES.eventos, label: 'Eventos', icon: CalendarDays },
      { to: ROUTES.validarAcceso, label: 'Validar QR', icon: QrCode, roles: ['ADMIN', 'COLABORADOR'] },
      { to: ROUTES.cuotas, label: 'Cuotas', icon: Coins, roles: ['ADMIN'] },
      {
        to: ROUTES.cobrarCuotaDeportiva,
        label: 'Cobrar cuota deportiva',
        icon: CreditCard,
        roles: ['ADMIN', 'COLABORADOR'],
      },
      {
        to: ROUTES.historialCuotaDeportiva,
        label: 'Historial deportivo',
        icon: ClipboardList,
        roles: ['ADMIN', 'COLABORADOR'],
      },
      {
        to: ROUTES.morososCuotaSocial,
        label: 'Morosos cuota social',
        icon: Coins,
        roles: ['ADMIN', 'COLABORADOR'],
      },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: ROUTES.usuarios, label: 'Usuarios', icon: ShieldCheck, roles: ['ADMIN'] },
      { to: ROUTES.auditoria, label: 'Auditoría', icon: ClipboardList, roles: ['ADMIN'] },
      { to: ROUTES.tareas, label: 'Tareas automáticas', icon: Timer, roles: ['ADMIN'] },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Panel de Inicio',
  [ROUTES.perfil]: 'Mi Perfil',
  [ROUTES.cambiarContrasena]: 'Cambiar Contraseña',
  [ROUTES.misCuotas]: 'Mis Cuotas',
  [ROUTES.misEntradas]: 'Mis Entradas',
  [ROUTES.hacermeSocio]: 'Hacerme Socio',
  [ROUTES.socios]: 'Socios del Club',
  [ROUTES.eventos]: 'Eventos y Actividades',
  [ROUTES.validarAcceso]: 'Control de Acceso QR',
  [ROUTES.usuarios]: 'Usuarios',
  [ROUTES.cuotas]: 'Configuración de Cuotas',
  [ROUTES.cobrarCuotaDeportiva]: 'Cobro de Cuota Deportiva',
  [ROUTES.historialCuotaDeportiva]: 'Historial de Cuotas Deportivas',
  [ROUTES.morososCuotaSocial]: 'Morosos de Cuota Social',
  [ROUTES.disciplinas]: 'Gestión de Disciplinas',
  [ROUTES.auditoria]: 'Auditoría de Operaciones',
  [ROUTES.tareas]: 'Tareas Automáticas',
  [ROUTES.participantes]: 'Participantes de Disciplinas',
};

/**
 * Estructura visual de las páginas autenticadas:
 * Inspirado en Apex Dashboard (shadcn/ui + Tailwind v4).
 */
export function AppLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const [colapsado, setColapsado] = useState(() => {
    try {
      return localStorage.getItem('sc-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleColapso = () => {
    setColapsado((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sc-sidebar-collapsed', String(next));
      } catch {
        // ignorar
      }
      return next;
    });
  };

  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>(() => {
    try {
      const guardado = localStorage.getItem('sc-sidebar-sections');
      if (guardado) {
        return JSON.parse(guardado) as Record<string, boolean>;
      }
    } catch {
      // fallback
    }
    return {
      Principal: true,
      'Gestión Social': true,
      Operaciones: true,
      Administración: true,
    };
  });

  const toggleSeccion = (titulo: string) => {
    setSeccionesAbiertas((prev) => {
      const next = {
        ...prev,
        [titulo]: prev[titulo] === false ? true : false,
      };
      try {
        localStorage.setItem('sc-sidebar-sections', JSON.stringify(next));
      } catch {
        // ignorar
      }
      return next;
    });
  };

  const tieneMembresia = usuario?.persona?.membresias?.some((m) => m.activo);
  const esOFueSocio = Boolean(
    usuario?.persona?.membresias && usuario.persona.membresias.length > 0,
  );

  // Filtrar secciones y sus ítems visibles según roles y membresía
  const seccionesVisibles = navSections
    .map((seccion) => ({
      ...seccion,
      items: seccion.items.filter(
        (item) =>
          (!item.soloSinMembresia || !tieneMembresia) &&
          !item.ocultarParaRoles?.some((rol) => usuario?.roles.includes(rol)) &&
          (!item.soloSocioOExSocio || esOFueSocio) &&
          (!item.roles || item.roles.some((rol) => usuario?.roles.includes(rol))),
      ),
    }))
    .filter((seccion) => seccion.items.length > 0);

  const iniciales =
    `${usuario?.nombre?.[0] ?? ''}${usuario?.apellido?.[0] ?? ''}`.toUpperCase() || 'SC';

  const rolPrincipal = usuario?.roles?.[0] ?? 'USUARIO';

  const tituloActual =
    ROUTE_TITLES[location.pathname] ??
    seccionesVisibles
      .flatMap((s) => s.items)
      .find((i) => i.to === location.pathname)?.label ??
    'SocialClub';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/70">
      {/* Sidebar estilo Apex Dashboard adaptado a SocialClub */}
      <aside
        className={cn(
          'relative z-40 flex flex-col justify-between border-r border-sidebar-border bg-sidebar-bg text-slate-300 transition-all duration-300 ease-in-out',
          colapsado ? 'w-[70px]' : 'w-[260px]',
        )}
      >
        {/* Botón flotante para colapsar/expandir en el borde derecho del sidebar */}
        <button
          type="button"
          onClick={toggleColapso}
          title={colapsado ? 'Expandir menú' : 'Contraer menú'}
          className="absolute -right-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-bg text-slate-400 shadow-md hover:border-brand-500/50 hover:bg-sidebar-surface hover:text-white transition-all focus:outline-none"
        >
          {colapsado ? (
            <ChevronRight size={13} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.5} />
          )}
        </button>

        {/* Cabecera del Sidebar con el Escudo Oficial */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-sidebar-border transition-all',
            colapsado ? 'justify-center px-0' : 'px-4 gap-3',
          )}
        >
          <ClubLogo size={colapsado ? 34 : 38} />
          {!colapsado && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold tracking-tight text-white">
                SocialClub
              </span>
              <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-brand-300/90">
                Panel de gestión
              </span>
            </div>
          )}
        </div>

        {/* Menú navegable con secciones */}
        <nav
          className={cn(
            'scrollbar-fade flex-1 overflow-y-auto py-4 transition-all',
            colapsado ? 'px-2 space-y-4' : 'px-3 space-y-5',
          )}
        >
          {seccionesVisibles.map((seccion, sIndex) => {
            const estaAbierta = seccionesAbiertas[seccion.title] !== false;

            return (
              <div key={seccion.title} className="space-y-1">
                {colapsado ? (
                  sIndex > 0 && <div className="my-2 mx-auto w-6 border-t border-sidebar-border" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSeccion(seccion.title)}
                    className="group flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400/70 hover:text-white transition-colors focus:outline-none select-none bg-transparent cursor-pointer"
                  >
                    <span className="transition-colors group-hover:text-white">{seccion.title}</span>
                    <ChevronDown
                      size={11}
                      strokeWidth={2}
                      className={cn(
                        'text-slate-500 transition-all duration-200 group-hover:text-white',
                        !estaAbierta && '-rotate-90',
                      )}
                    />
                  </button>
                )}

                {(!colapsado && !estaAbierta) ? null : (
                  <div className="space-y-0.5">
                    {seccion.items.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === ROUTES.dashboard}
                        title={colapsado ? label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center border transition-colors duration-75 select-none',
                            colapsado
                              ? cn(
                                'mx-auto h-10 w-10 justify-center rounded-xl',
                                isActive
                                  ? 'bg-brand-900/40 text-brand-400 border-brand-500/40'
                                  : 'bg-transparent text-slate-300/80 border-transparent hover:bg-sidebar-border/50 hover:text-white',
                              )
                              : cn(
                                'gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                isActive
                                  ? 'bg-brand-900/40 text-brand-300 border-brand-500/30'
                                  : 'bg-transparent text-slate-300/80 border-transparent hover:bg-sidebar-border/50 hover:text-white',
                              ),
                          )
                        }
                      >
                        <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                        {!colapsado && <span className="truncate flex-1">{label}</span>}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pie de Usuario */}
        <div className="border-t border-sidebar-border p-3">
          {colapsado ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${usuario?.nombre} ${usuario?.apellido} (${rolPrincipal})`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-800 text-xs font-bold text-white shadow-xs ring-1 ring-white/10"
              >
                {iniciales}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-sidebar-surface/80 border border-sidebar-border p-2 transition-all">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-800 text-xs font-bold text-white shadow-xs ring-1 ring-white/10">
                  {iniciales}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs font-semibold text-white">
                    {usuario?.nombre} {usuario?.apellido}
                  </span>
                  <span className="truncate text-[10px] font-medium text-brand-300/90">
                    {rolPrincipal}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void logout()}
                title="Cerrar sesión"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-sidebar-border hover:text-rose-400 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Contenedor Principal: Top Header + Contenido de Ruta */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar estilo Apex */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/90 px-8 backdrop-blur-xs shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              {tituloActual}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>SocialClub</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
              {rolPrincipal}
            </span>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="min-w-0 flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
