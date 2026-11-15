import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
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

interface PortalNavSection {
  titulo: string;
  items: PortalNavItem[];
}

const PORTAL_NAV_SECTIONS: PortalNavSection[] = [
  {
    titulo: 'Mi espacio',
    items: [
      { to: ROUTES.dashboard, label: 'Mi perfil', icon: User },
      { to: ROUTES.misCuotas, label: 'Mis cuotas', icon: CreditCard, soloSocioOExSocio: true },
      { to: ROUTES.hacermeSocio, label: 'Hacerme socio', icon: UserPlus, soloSinMembresia: true },
    ],
  },
  {
    titulo: 'Club y actividades',
    items: [
      { to: ROUTES.eventos, label: 'Eventos', icon: CalendarDays },
      { to: ROUTES.misEntradas, label: 'Mis entradas', icon: Ticket },
      { to: ROUTES.misReservas, label: 'Mis reservas', icon: CalendarClock },
      { to: ROUTES.solicitarInscripcion, label: 'Inscribirme a disciplina', icon: Dumbbell },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [
      { to: ROUTES.miDocumentacion, label: 'Mi documentación', icon: FileText },
      { to: ROUTES.perfil, label: 'Editar mis datos', icon: UserCog },
      { to: ROUTES.cambiarContrasena, label: 'Cambiar contraseña', icon: KeyRound },
    ],
  },
];

/**
 * Layout exclusivo para Socios y Participantes:
 * Estética oscura minimalista inspirada en Global Fan, con navegación lateral
 * organizada por secciones, cabecera limpia y contenedor principal fijo.
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

  const seccionesVisibles = PORTAL_NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter(
      (item) =>
        (!item.soloSinMembresia || !tieneMembresia) &&
        (!item.soloSocioOExSocio || esOFueSocio),
    ),
  })).filter((sec) => sec.items.length > 0);

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
      className="portal-dark fixed inset-0 flex flex-col overflow-hidden overscroll-none bg-[#050608] text-zinc-100 selection:bg-emerald-400/25"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 70% 42% at 50% -12%, rgba(74, 222, 128, 0.08), transparent), radial-gradient(ellipse 45% 32% at 88% 0%, rgba(56, 189, 248, 0.05), transparent)',
      }}
    >
      {/* Header superior fijo */}
      <header className="relative z-30 shrink-0 border-b border-white/[0.07] bg-[#050608]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          {/* Izquierda: botón menú móvil + Marca */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto((prev) => !prev)}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] lg:hidden"
            >
              {menuMovilAbierto ? <X size={18} /> : <Menu size={18} />}
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.dashboard)}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            >
              <ClubLogo size={32} />
              <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">
                SocialClub
              </span>
            </button>
          </div>

          {/* Esquina superior derecha: Nombre y Rol del socio/participante */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-4 pr-1.5">
              <div className="flex flex-col items-end leading-tight">
                <span className="max-w-[160px] truncate text-sm font-medium text-zinc-100 sm:max-w-[240px]">
                  {nombreCompleto}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      tieneMembresia ? 'bg-emerald-400' : 'bg-amber-400',
                    )}
                  />
                  {etiquetaRol}
                </span>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800/90 text-xs font-semibold text-zinc-100 ring-1 ring-white/15">
                {iniciales}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cuerpo principal con geometría fija: aside fijo a la izquierda y contenedor derecho de tamaño constante */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-6 sm:px-8 lg:flex-row lg:items-stretch lg:gap-8 lg:pt-7">
        {/* Menú lateral izquierdo fijo por secciones */}
        <aside
          className={cn(
            'w-full shrink-0 lg:block lg:w-[256px] lg:overflow-y-auto lg:pb-8',
            menuMovilAbierto ? 'block' : 'hidden',
          )}
        >
          <nav
            aria-label="Menú del socio"
            className="space-y-5 rounded-2xl border border-white/[0.07] bg-[#0b0d11]/90 p-3"
          >
            {seccionesVisibles.map((seccion) => (
              <div key={seccion.titulo} className="space-y-1">
                <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  {seccion.titulo}
                </p>
                <div className="space-y-0.5">
                  {seccion.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === ROUTES.dashboard}
                      onClick={() => setMenuMovilAbierto(false)}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-all',
                          isActive
                            ? 'bg-white/[0.08] font-medium text-white ring-1 ring-white/[0.08]'
                            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            strokeWidth={1.8}
                            className={cn(
                              'shrink-0 transition-colors',
                              isActive
                                ? 'text-emerald-400'
                                : 'text-zinc-500 group-hover:text-zinc-200',
                            )}
                          />
                          <span className="truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-white/[0.07] pt-2">
              <button
                type="button"
                onClick={() => void logout()}
                title="Cerrar sesión"
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
              >
                <LogOut
                  size={16}
                  strokeWidth={1.8}
                  className="shrink-0 text-zinc-500 transition-colors group-hover:text-rose-400"
                />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Área de contenido principal con ancho y alto fijos y scroll interno propio */}
        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-none',
            esRutaInicio
              ? 'pb-8'
              : 'mb-6 rounded-2xl border border-white/[0.07] bg-[#0b0d11]/95 p-6 text-zinc-100 shadow-2xl sm:p-8 lg:mb-8',
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
