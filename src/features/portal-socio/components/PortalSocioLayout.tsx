import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Dumbbell,
  FileText,
  KeyRound,
  LogOut,
  Menu,
  Ticket,
  User,
  UserCog,
  UserPlus,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
import { PortalBrandLogo } from './PortalUI';

interface AsideNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  soloSinMembresia?: boolean;
  soloSocioOExSocio?: boolean;
  end?: boolean;
}

const PORTAL_ASIDE_LINKS: AsideNavItem[] = [
  { to: ROUTES.dashboard, label: 'Mi perfil', icon: User, end: true },
  { to: ROUTES.misCuotas, label: 'Mis cuotas', icon: CreditCard, soloSocioOExSocio: true },
  { to: ROUTES.hacermeSocio, label: 'Hacerme socio', icon: UserPlus, soloSinMembresia: true },
  { to: ROUTES.eventos, label: 'Eventos', icon: CalendarDays },
  { to: ROUTES.misEntradas, label: 'Mis entradas', icon: Ticket },
  { to: ROUTES.misReservas, label: 'Mis reservas', icon: CalendarClock },
  { to: ROUTES.solicitarInscripcion, label: 'Disciplinas', icon: Dumbbell },
  { to: ROUTES.miDocumentacion, label: 'Documentación', icon: FileText },
];

const PORTAL_ACCOUNT_LINKS: AsideNavItem[] = [
  { to: ROUTES.perfil, label: 'Editar mis datos', icon: UserCog },
  { to: ROUTES.cambiarContrasena, label: 'Cambiar contraseña', icon: KeyRound },
];

/**
 * Shell exclusivo del Portal de Socios y Participantes:
 * Únicamente toma de referencia estructural el `aside` de perfil + lista con chevrones de RiverID,
 * adaptado al tema oscuro obsidian + detalles azul eléctrico y geometría afilada (sin reutilizar
 * componentes ni patrones de administración).
 */
export function PortalSocioLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevScheme = html.style.colorScheme;

    html.style.backgroundColor = '#03060c';
    body.style.backgroundColor = '#03060c';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';
    html.style.colorScheme = 'dark';

    return () => {
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      html.style.colorScheme = prevScheme;
    };
  }, []);

  const tieneMembresia = Boolean(usuario?.persona?.membresias?.some((m) => m.activo));
  const membresiaActiva = usuario?.persona?.membresias?.find((m) => m.activo);
  const esOFueSocio = Boolean(
    usuario?.persona?.membresias && usuario.persona.membresias.length > 0,
  );

  const linksPrincipales = PORTAL_ASIDE_LINKS.filter(
    (item) =>
      (!item.soloSinMembresia || !tieneMembresia) &&
      (!item.soloSocioOExSocio || esOFueSocio),
  );

  const nombreCompleto = usuario
    ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim() || usuario.email
    : 'Invitado';

  const iniciales =
    `${usuario?.nombre?.[0] ?? ''}${usuario?.apellido?.[0] ?? ''}`.toUpperCase() || 'SC';

  const etiquetaRol = tieneMembresia
    ? `Socio${membresiaActiva?.categoria?.nombre ? ` · ${membresiaActiva.categoria.nombre}` : ''}`
    : usuario?.roles?.includes('SOCIO')
      ? 'Socio'
      : 'Participante';

  async function handleLogout() {
    setDrawerAbierto(false);
    await logout();
    navigate(ROUTES.login);
  }

  function renderAsideContent(onNavigate?: () => void) {
    return (
      <div className="flex flex-col">
        {/* Bloque de identidad estilo RiverID (nombre en azul + rol + avatar circular a la derecha) */}
        <div className="flex items-center justify-between gap-3 px-1 pb-5">
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold tracking-[-0.02em] text-blue-400">
              {nombreCompleto}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-300">{etiquetaRol}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-400/35 bg-blue-500/12 text-xs font-semibold text-blue-300">
            {iniciales}
          </div>
        </div>

        {/* Lista de navegación vertical separada por hairlines con flecha > a la derecha */}
        <nav
          aria-label="Menú del portal de socio"
          className="divide-y divide-slate-300/[0.08] border-y border-slate-300/[0.08]"
        >
          {linksPrincipales.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center justify-between px-2.5 py-3 text-[13.5px] font-medium transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
                  isActive
                    ? 'bg-blue-500/[0.09] text-white'
                    : 'text-slate-300 hover:bg-white/[0.03] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 left-0 w-px bg-blue-400"
                    />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon
                      size={15}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-400 group-hover:text-blue-300',
                      )}
                    />
                    <span>{label}</span>
                  </span>
                  <ChevronRight
                    size={14}
                    className={cn(
                      'shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5',
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}

          {PORTAL_ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center justify-between px-2.5 py-3 text-[13.5px] font-medium transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
                  isActive
                    ? 'bg-blue-500/[0.09] text-white'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 left-0 w-px bg-blue-400"
                    />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon
                      size={15}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-500 group-hover:text-blue-300',
                      )}
                    />
                    <span>{label}</span>
                  </span>
                  <ChevronRight
                    size={14}
                    className={cn(
                      'shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5',
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="group flex w-full items-center justify-between px-2.5 py-3 text-[13.5px] font-medium text-slate-400 transition-colors hover:bg-rose-500/[0.06] hover:text-rose-300 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <LogOut
                size={15}
                className="shrink-0 text-slate-500 transition-colors group-hover:text-rose-400"
              />
              <span>Cerrar sesión</span>
            </span>
            <ChevronRight
              size={14}
              className="shrink-0 text-slate-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-rose-400"
            />
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="portal-socio min-h-screen bg-[#03060c] text-slate-100 flex flex-col">
      {/* Barra superior compacta (sin menú admin ni pills) */}
      <header className="sticky top-0 z-40 h-14 border-b border-white/[0.08] bg-[#03060c]/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerAbierto(true)}
              aria-label="Abrir menú"
              className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/[0.14] bg-[#070c16] text-slate-200 transition-colors hover:border-blue-400/50 lg:hidden cursor-pointer"
            >
              <Menu size={16} />
            </button>

            <NavLink to={ROUTES.dashboard} className="flex items-center gap-2.5">
              <PortalBrandLogo size={28} />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
                SocialClub
              </span>
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-[2px] border border-blue-400/25 bg-blue-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-blue-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              Portal del Socio
            </span>
          </div>
        </div>
      </header>

      {/* Drawer móvil del aside estilo RiverID */}
      {drawerAbierto && (
        <div
          className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-[2px] lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawerAbierto(false);
          }}
        >
          <aside className="flex h-full w-72 flex-col justify-between overflow-y-auto border-r border-white/[0.10] bg-[#050912] p-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PortalBrandLogo size={24} />
                  <span className="text-sm font-semibold text-white">SocialClub</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerAbierto(false)}
                  aria-label="Cerrar menú"
                  className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-white/[0.14] bg-white/[0.03] text-slate-300 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
              {renderAsideContent(() => setDrawerAbierto(false))}
            </div>
          </aside>
        </div>
      )}

      {/* Cuerpo principal: Aside estilo RiverID a la izquierda + Contenido del Portal */}
      <div className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="hidden lg:block lg:sticky lg:top-22 lg:self-start">
          {renderAsideContent()}
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Pie mínimo oscuro de la marca del club */}
      <footer className="border-t border-white/[0.07] bg-[#03060c]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span className="font-medium text-slate-400">Club Digital</span>
          <span className="tabular-nums">© {new Date().getFullYear()} SocialClub · Todos los derechos reservados</span>
        </div>
      </footer>
    </div>
  );
}
