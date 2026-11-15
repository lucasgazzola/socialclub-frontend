import { Link, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, FileText } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

/**
 * TASK-60 — Sección Disciplinas de Mi club: inscripciones (catálogo y mis
 * solicitudes, US-63/64) y documentación (DT-28) bajo un mismo lugar.
 */
export function SeccionDisciplinas() {
  const { pathname } = useLocation();
  const enDocumentacion = pathname.startsWith(ROUTES.miDocumentacion);

  const pestanias = [
    { to: ROUTES.misSolicitudesInscripcion, label: 'Inscripciones', icon: ClipboardList, activa: !enDocumentacion },
    { to: ROUTES.miDocumentacion, label: 'Documentación', icon: FileText, activa: enDocumentacion },
  ];

  return (
    <div className="space-y-6">
      <nav aria-label="Disciplinas" className="flex gap-2 border-b border-slate-200">
        {pestanias.map(({ to, label, icon: Icon, activa }) => (
          <Link
            key={to}
            to={to}
            aria-current={activa ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors',
              activa
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
            )}
          >
            <Icon size={16} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
