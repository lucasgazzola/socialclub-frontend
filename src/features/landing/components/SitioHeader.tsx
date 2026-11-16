import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { ClubLogo } from '@/components/ui';
import { CLUB } from '@/config/club';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES, destinosDeSesion } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

const ENLACES = [
  { href: '#club', label: 'El club' },
  { href: '#disciplinas', label: 'Disciplinas' },
  { href: '#eventos', label: 'Eventos' },
  { href: '#planes', label: 'Planes' },
];

interface SitioHeaderProps {
  /** Sobre el hero oscuro de la landing o sobre fondo claro (alta de socio). */
  variante?: 'oscuro' | 'claro';
  /** Muestra los enlaces a las secciones de la landing. */
  conSecciones?: boolean;
}

/**
 * Encabezado del sitio público. Con sesión ofrece la zona que le toca
 * (las dos, solo si gestiona y es socio). Sin sesión, ingresar o asociarse.
 */
export function SitioHeader({ variante = 'oscuro', conSecciones = true }: SitioHeaderProps) {
  const { usuario } = useAuth();
  const [conFondo, setConFondo] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const oscuro = variante === 'oscuro';

  useEffect(() => {
    const alScrollear = () => setConFondo(window.scrollY > 24);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  const claseTexto = oscuro ? 'text-white' : 'text-slate-900';
  const destinos = usuario ? destinosDeSesion(usuario.roles) : [];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        oscuro
          ? conFondo || menuAbierto
            ? 'bg-[#0A1A4F]/90 shadow-lg shadow-black/10 backdrop-blur-md'
            : 'bg-transparent'
          : 'border-b border-slate-200/80 bg-white/90 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={ROUTES.inicio} className="flex min-w-0 items-center gap-2.5">
          <ClubLogo size={38} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className={cn('truncate text-sm font-bold tracking-tight', claseTexto)}>{CLUB.nombreCorto}</span>
            <span className={cn('text-[10px] font-semibold uppercase tracking-[0.2em]', oscuro ? 'text-brand-200' : 'text-brand-600')}>
              Club Sportivo
            </span>
          </span>
        </Link>

        {conSecciones && (
          <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
            {ENLACES.map((e) => (
              <a
                key={e.href}
                href={e.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  oscuro ? 'text-slate-200 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {e.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {usuario ? (
            destinos.map((destino) => {
              const principal = destinos.length === 1 || destino.to === ROUTES.miClub;
              return (
                <Link
                  key={destino.to}
                  to={destino.to}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors',
                    principal
                      ? cn(
                          'px-5 font-semibold transition-transform hover:-translate-y-0.5',
                          oscuro ? 'bg-white text-[#0A1A4F]' : 'bg-brand-600 text-white',
                        )
                      : cn(
                          'font-medium',
                          oscuro ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
                        ),
                  )}
                >
                  {destino.to === ROUTES.dashboard && <LayoutDashboard size={15} aria-hidden />}
                  {destino.to === ROUTES.dashboard ? 'Panel' : 'Mi club'}
                </Link>
              );
            })
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className={cn(
                  'inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors',
                  oscuro ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                Ingresar
              </Link>
              <Link
                to={ROUTES.hacermeSocio}
                className={cn(
                  'hidden h-10 items-center rounded-full px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5 sm:inline-flex',
                  oscuro ? 'bg-white text-[#0A1A4F]' : 'bg-brand-600 text-white',
                )}
              >
                Asociate
              </Link>
            </>
          )}

          {conSecciones && (
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              className={cn(
                'rounded-full p-2 lg:hidden',
                oscuro ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              {menuAbierto ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {conSecciones && menuAbierto && (
        <nav aria-label="Secciones" className="border-t border-white/10 px-4 pb-4 lg:hidden">
          {ENLACES.map((e) => (
            <a
              key={e.href}
              href={e.href}
              onClick={() => setMenuAbierto(false)}
              className={cn(
                'block rounded-xl px-3 py-3 text-base font-medium',
                oscuro ? 'text-slate-100 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              {e.label}
            </a>
          ))}
          {!usuario && (
            <Link
              to={ROUTES.hacermeSocio}
              className="mt-2 flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#0A1A4F]"
            >
              Quiero ser socio
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
