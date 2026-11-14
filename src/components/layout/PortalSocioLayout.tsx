import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
import { ClubLogo } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  soloSinMembresia?: boolean;
  soloSocioOExSocio?: boolean;
}

const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { to: ROUTES.dashboard, label: 'Mi perfil', icon: User },
  { to: ROUTES.misEntradas, label: 'Mis entradas', icon: Ticket },
  { to: ROUTES.misReservas, label: 'Mis reservas', icon: CalendarClock },
  { to: ROUTES.eventos, label: 'Eventos', icon: CalendarDays },
  { to: ROUTES.misCuotas, label: 'Mis cuotas', icon: CreditCard, soloSocioOExSocio: true },
  { to: ROUTES.hacermeSocio, label: 'Hacerme socio', icon: UserPlus, soloSinMembresia: true },
  { to: ROUTES.solicitarInscripcion, label: 'Inscribirme a disciplina', icon: Dumbbell },
  { to: ROUTES.miDocumentacion, label: 'Mi documentación', icon: FileText },
  { to: ROUTES.perfil, label: 'Editar mis datos', icon: UserCog },
  { to: ROUTES.cambiarContrasena, label: 'Cambiar contraseña', icon: KeyRound },
];

/**
 * Layout exclusivo para Socios y Participantes:
 * Inspirado en portales modernos de socios (fondo oscuro institucional, navegación lateral limpia
 * con indicadores de chevron y cabecera con identidad del usuario en la esquina superior derecha).
 */
export function PortalSocioLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const tieneMembresia = Boolean(usuario?.persona?.membresias?.some((m) => m.activo));
  const membresiaActiva = usuario?.persona?.membresias?.find((m) => m.activo);
  const esOFueSocio = Boolean(
    usuario?.persona?.membresias && usuario.persona.membresias.length > 0,
  );

  const itemsVisibles = PORTAL_NAV_ITEMS.filter(
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

  const esRutaInicio = location.pathname === ROUTES.dashboard;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden overscroll-none bg-[#060d1f] text-slate-100 selection:bg-brand-500/30"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0, 95, 194, 0.22), transparent), radial-gradient(ellipse 50% 40% at 95% 100%, rgba(249, 115, 22, 0.08), transparent)',
      }}
    >
      {/* Franja sutil lateral derecha en color institucional */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 right-0 z-20 w-1 bg-gradient-to-b from-brand-500 via-brand-600 to-accent-500"
      />

      {/* Header superior fijo */}
      <header className="relative z-30 shrink-0 border-b border-white/10 bg-[#060d1f]">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          {/* Izquierda: botón menú móvil + Marca */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto((prev) => !prev)}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 lg:hidden"
            >
              {menuMovilAbierto ? <X size={18} /> : <Menu size={18} />}
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.dashboard)}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <ClubLogo size={38} />
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  SOCIALCLUB
                </span>
                <span className="text-xl font-extrabold tracking-tight text-brand-400">
                  ID
                </span>
              </div>
            </button>
          </div>

          {/* Esquina superior derecha: Nombre y Rol del socio/participante */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-4 pr-2 shadow-sm">
              <div className="flex flex-col items-end leading-tight">
                <span className="max-w-[160px] truncate text-sm font-semibold text-white sm:max-w-[240px]">
                  {nombreCompleto}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-300">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      tieneMembresia ? 'bg-emerald-400' : 'bg-accent-400',
                    )}
                  />
                  {etiquetaRol}
                </span>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-xs font-bold text-white ring-2 ring-white/20">
                {iniciales}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cuerpo principal con geometría fija: aside fijo a la izquierda y contenedor derecho de tamaño constante */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-6 sm:px-8 lg:flex-row lg:items-stretch lg:gap-10 lg:pt-8">
        {/* Menú lateral izquierdo fijo (nunca se deforma ni scrollea con el contenido derecho) */}
        <aside
          className={cn(
            'w-full shrink-0 lg:block lg:w-[260px] lg:overflow-y-auto lg:pb-8',
            menuMovilAbierto ? 'block' : 'hidden',
          )}
        >
          <nav aria-label="Menú del socio" className="divide-y divide-white/10">
            {itemsVisibles.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.dashboard}
                onClick={() => setMenuMovilAbierto(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between py-3.5 px-2.5 text-sm transition-colors',
                    isActive
                      ? 'border-l-2 border-brand-400 bg-white/[0.06] font-semibold text-white'
                      : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive
                            ? 'text-brand-400'
                            : 'text-slate-400 group-hover:text-brand-300',
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    <ChevronRight
                      size={15}
                      className={cn(
                        'shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
                        isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={() => void logout()}
              title="Cerrar sesión"
              className="group flex w-full items-center justify-between py-3.5 px-2.5 text-sm text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <LogOut
                  size={17}
                  strokeWidth={1.8}
                  className="shrink-0 text-slate-400 group-hover:text-rose-400 transition-colors"
                />
                <span>Cerrar sesión</span>
              </span>
              <ChevronRight
                size={15}
                className="shrink-0 text-slate-500 group-hover:text-rose-300 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
          </nav>
        </aside>

        {/* Área de contenido principal con ancho y alto fijos y scroll interno propio */}
        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-none',
            esRutaInicio
              ? 'pb-8'
              : 'mb-6 rounded-2xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8 lg:mb-8',
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
