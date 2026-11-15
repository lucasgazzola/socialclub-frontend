import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
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
import { ClubLogo } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

interface NavPillItem {
  to: string;
  label: string;
  icon: LucideIcon;
  soloSinMembresia?: boolean;
  soloSocioOExSocio?: boolean;
}

const PORTAL_TOP_LINKS: NavPillItem[] = [
  { to: ROUTES.dashboard, label: 'Mi perfil', icon: User },
  { to: ROUTES.misCuotas, label: 'Mis cuotas', icon: CreditCard, soloSocioOExSocio: true },
  { to: ROUTES.hacermeSocio, label: 'Hacerme socio', icon: UserPlus, soloSinMembresia: true },
  { to: ROUTES.eventos, label: 'Eventos', icon: CalendarDays },
  { to: ROUTES.misEntradas, label: 'Mis entradas', icon: Ticket },
  { to: ROUTES.misReservas, label: 'Mis reservas', icon: CalendarClock },
  { to: ROUTES.solicitarInscripcion, label: 'Disciplinas', icon: Dumbbell },
  { to: ROUTES.miDocumentacion, label: 'Documentación', icon: FileText },
];

/**
 * Shell exclusivo para Socios y Participantes:
 * Arquitectura 100% propia (cabecera horizontal fija estilo Global Fan con cápsula de
 * navegación centrada y menú de cuenta origin-aware, sin barra lateral administrativa).
 */
export function PortalSocioLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);
  const cuentaRef = useRef<HTMLDivElement>(null);

  const tieneMembresia = Boolean(usuario?.persona?.membresias?.some((m) => m.activo));
  const membresiaActiva = usuario?.persona?.membresias?.find((m) => m.activo);
  const esOFueSocio = Boolean(
    usuario?.persona?.membresias && usuario.persona.membresias.length > 0,
  );

  const linksVisibles = PORTAL_TOP_LINKS.filter(
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

  useEffect(() => {
    if (!menuCuentaAbierto) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (cuentaRef.current && !cuentaRef.current.contains(e.target as Node)) {
        setMenuCuentaAbierto(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuCuentaAbierto(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuCuentaAbierto]);

  return (
    <div
      className="portal-socio flex min-h-screen flex-col bg-[#060709] text-zinc-100"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 68% 36% at 50% -14%, rgba(74, 222, 128, 0.07), transparent), radial-gradient(ellipse 40% 26% at 88% -4%, rgba(56, 189, 248, 0.05), transparent)',
      }}
    >
      {/* Cabecera superior fija estilo Global Fan */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-white/[0.07] bg-[#060709]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Izquierda: Trigger móvil + Marca SocialClub */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto((prev) => !prev)}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuMovilAbierto}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-200 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95] hover:bg-white/[0.08] lg:hidden cursor-pointer"
            >
              {menuMovilAbierto ? <X size={17} /> : <Menu size={17} />}
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.dashboard)}
              className="flex items-center gap-2.5 text-left transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400/70 rounded-lg cursor-pointer"
            >
              <ClubLogo size={30} />
              <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">
                SocialClub
              </span>
            </button>
          </div>

          {/* Centro (Desktop): Cápsula flotante horizontal con rutas directas del socio */}
          <nav
            aria-label="Navegación del socio"
            className="hidden lg:flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#0d1016] p-1"
          >
            {linksVisibles.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.dashboard}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap select-none',
                    'transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/70',
                    isActive
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Derecha: Identidad del socio + Popover origin-aware de cuenta */}
          <div className="relative shrink-0" ref={cuentaRef}>
            <button
              type="button"
              onClick={() => setMenuCuentaAbierto((prev) => !prev)}
              aria-expanded={menuCuentaAbierto}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-[#0d1016] py-1 pl-3.5 pr-1.5 transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-white/20 hover:bg-[#131720] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/70 cursor-pointer"
            >
              <div className="flex flex-col items-end leading-tight text-right">
                <span className="max-w-[140px] truncate text-xs font-medium text-white sm:max-w-[200px] sm:text-[13px]">
                  {nombreCompleto}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      tieneMembresia ? 'bg-emerald-400' : 'bg-amber-400',
                    )}
                  />
                  {etiquetaRol}
                </span>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white ring-1 ring-white/15">
                {iniciales}
              </div>

              <ChevronDown
                size={14}
                className={cn(
                  'mr-1 text-zinc-400 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
                  menuCuentaAbierto && 'rotate-180 text-white',
                )}
              />
            </button>

            {/* Popover con transform-origin: top right */}
            <div
              role="menu"
              aria-label="Opciones de cuenta"
              className={cn(
                'absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/[0.1] bg-[#0d1016] p-1.5 shadow-2xl ring-1 ring-black/60',
                'transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
                menuCuentaAbierto
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-[0.96] opacity-0',
              )}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuCuentaAbierto(false);
                  navigate(ROUTES.perfil);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-zinc-300 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                <UserCog size={15} className="text-zinc-400" />
                Editar mis datos
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuCuentaAbierto(false);
                  navigate(ROUTES.cambiarContrasena);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-zinc-300 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                <KeyRound size={15} className="text-zinc-400" />
                Cambiar contraseña
              </button>
              <div className="my-1 border-t border-white/[0.07]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuCuentaAbierto(false);
                  void logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-rose-300 transition-colors duration-150 hover:bg-rose-500/12 hover:text-rose-200 cursor-pointer"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Drawer móvil / tablet */}
        {menuMovilAbierto && (
          <nav
            aria-label="Navegación móvil del socio"
            className="border-t border-white/[0.07] bg-[#090b0f] px-4 py-4 lg:hidden"
          >
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {linksVisibles.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === ROUTES.dashboard}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-white text-zinc-950'
                        : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white',
                    )
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Canvas principal amplio (sin contenedores cerrados administrativos) */}
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
