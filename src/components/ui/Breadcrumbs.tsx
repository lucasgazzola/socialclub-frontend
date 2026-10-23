import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { resolverBreadcrumbs, type BreadcrumbItem } from './breadcrumbs.utils';

export { resolverBreadcrumbs };
export type { BreadcrumbItem };

export interface BreadcrumbsProps {
  /**
   * Lista explícita de elementos de migas de pan.
   * Si no se proporciona, se resuelven automáticamente a partir de `location.pathname`.
   */
  items?: BreadcrumbItem[];
  /** Clases adicionales para el elemento contenedor `<nav>`. */
  className?: string;
  /** Si es true, muestra el ícono de Inicio (Home) en el primer ítem. Por defecto false. */
  mostrarIconoInicio?: boolean;
}

export function Breadcrumbs({
  items,
  className,
  mostrarIconoInicio = false,
}: BreadcrumbsProps) {
  const location = useLocation();
  const listaItems = items ?? resolverBreadcrumbs(location.pathname);

  if (!listaItems || listaItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Ruta de navegación"
      className={cn('flex items-center min-w-0', className)}
    >
      <ol className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm">
        {listaItems.map((item, index) => {
          const esPrimero = index === 0;
          const esUltimo = index === listaItems.length - 1;
          const Icono = item.icon ?? (esPrimero && mostrarIconoInicio ? Home : undefined);

          return (
            <li
              key={`${item.label}-${item.to ?? index}`}
              className="inline-flex items-center gap-1.5 min-w-0"
            >
              {index > 0 && (
                <ChevronRight
                  size={13}
                  className="text-slate-400 shrink-0 select-none"
                  aria-hidden="true"
                />
              )}

              {item.to && !esUltimo ? (
                <Link
                  to={item.to}
                  className="group inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-900 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 rounded-xs"
                >
                  {Icono && (
                    <Icono
                      size={14}
                      className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-900 select-none"
                  aria-current={esUltimo ? 'page' : undefined}
                >
                  {Icono && (
                    <Icono
                      size={14}
                      className="text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className="truncate max-w-[180px] sm:max-w-[300px] md:max-w-none"
                    aria-current={esUltimo ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
