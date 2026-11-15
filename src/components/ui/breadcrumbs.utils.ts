import { ROUTES } from '@/routes/paths';
import type { LucideIcon } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: LucideIcon;
}

export interface RutaMeta {
  label: string;
  parent?: string;
}

export const RUTAS_BREADCRUMBS: Record<string, RutaMeta> = {
  [ROUTES.dashboard]: { label: 'Inicio' },
  [ROUTES.dashboardGestion]: { label: 'Dashboard', parent: ROUTES.dashboard },
  [ROUTES.solicitudesReserva]: { label: 'Solicitudes de Reserva', parent: ROUTES.dashboard },
  [ROUTES.espacios]: { label: 'Espacios Físicos', parent: ROUTES.dashboard },
  [ROUTES.socios]: { label: 'Socios', parent: ROUTES.dashboard },
  [ROUTES.participantes]: { label: 'Participantes', parent: ROUTES.dashboard },
  [ROUTES.disciplinas]: { label: 'Disciplinas', parent: ROUTES.dashboard },
  [ROUTES.usuarios]: { label: 'Usuarios', parent: ROUTES.dashboard },
  [ROUTES.auditoria]: { label: 'Auditoría', parent: ROUTES.dashboard },
  [ROUTES.tareas]: { label: 'Tareas Automáticas', parent: ROUTES.dashboard },
  [ROUTES.eventosAdmin]: { label: 'Eventos', parent: ROUTES.dashboard },
  [ROUTES.validarAcceso]: { label: 'Validar QR', parent: ROUTES.dashboard },
  [ROUTES.cuotas]: { label: 'Cuotas', parent: ROUTES.dashboard },
  [ROUTES.cuotaSocial]: { label: 'Cuota Social', parent: ROUTES.cuotas },
  [ROUTES.morososCuotaSocial]: { label: 'Morosos', parent: ROUTES.cuotaSocial },
  [ROUTES.cuotaDeportiva]: { label: 'Cuota Deportiva', parent: ROUTES.cuotas },
  [ROUTES.cobrarCuotaDeportiva]: { label: 'Cobrar Cuota', parent: ROUTES.cuotaDeportiva },
  [ROUTES.historialCuotaDeportiva]: { label: 'Historial', parent: ROUTES.cuotaDeportiva },
  [ROUTES.morososCuotaDeportiva]: { label: 'Morosos', parent: ROUTES.cuotaDeportiva },
  [ROUTES.estadoFinanciero]: { label: 'Estado Financiero', parent: ROUTES.dashboard },
  [ROUTES.reporteAsistencia]: { label: 'Asistencia a Eventos', parent: ROUTES.dashboard },
};

export interface RutaDinamica {
  pattern: RegExp;
  getMeta: (match: RegExpMatchArray) => { label: string; parent: string };
}

export const RUTAS_DINAMICAS: RutaDinamica[] = [
  {
    pattern: /^\/admin\/disciplinas\/([^/]+)\/categorias$/,
    getMeta: () => ({ label: 'Categorías', parent: ROUTES.disciplinas }),
  },
  {
    pattern: /^\/admin\/eventos\/([^/]+)\/validar$/,
    getMeta: () => ({ label: 'Validar QR', parent: ROUTES.eventosAdmin }),
  },
  {
    pattern: /^\/admin\/socios\/([^/]+)\/editar$/,
    getMeta: () => ({ label: 'Editar Socio', parent: ROUTES.socios }),
  },
  {
    pattern: /^\/admin\/participante\/([^/]+)\/editar$/,
    getMeta: () => ({ label: 'Editar Participante', parent: ROUTES.participantes }),
  },
  {
    pattern: /^\/admin\/cuotas\/social\/([^/]+)\/editar$/,
    getMeta: () => ({ label: 'Editar Cuota Social', parent: ROUTES.cuotaSocial }),
  },
];

export function resolverBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const rutaLimpia = pathname.replace(/\/+$/, '') || '/';

  // Si estamos en la raíz (Dashboard / Inicio), no se muestran migas de pan
  if (rutaLimpia === '/' || rutaLimpia === ROUTES.dashboard) {
    return [];
  }

  const trail: BreadcrumbItem[] = [];
  let actual: string | undefined = rutaLimpia;
  let intentos = 0;

  while (actual && intentos < 8) {
    intentos++;

    if (actual === ROUTES.dashboard || actual === '/') {
      trail.unshift({ label: 'Inicio', to: ROUTES.dashboard });
      break;
    }

    const staticMeta: RutaMeta | undefined = RUTAS_BREADCRUMBS[actual];
    if (staticMeta) {
      trail.unshift({ label: staticMeta.label, to: actual });
      actual = staticMeta.parent;
      continue;
    }

    let encontrado = false;
    for (const dinamica of RUTAS_DINAMICAS) {
      const match = actual.match(dinamica.pattern);
      if (match) {
        const meta = dinamica.getMeta(match);
        trail.unshift({ label: meta.label, to: actual });
        actual = meta.parent;
        encontrado = true;
        break;
      }
    }
    if (encontrado) continue;

    // Segmentación genérica de fallback
    const lastSlash = actual.lastIndexOf('/');
    const segmentName = actual.substring(lastSlash + 1);
    const label = segmentName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    trail.unshift({ label, to: actual });
    actual = lastSlash > 0 ? actual.substring(0, lastSlash) : ROUTES.dashboard;
  }

  if (trail.length === 0 || trail[0].to !== ROUTES.dashboard) {
    trail.unshift({ label: 'Inicio', to: ROUTES.dashboard });
  }

  // El último ítem representa la página actual activa (sin enlace para evitar recargas cíclicas)
  if (trail.length > 1) {
    const ultimo = trail.length - 1;
    trail[ultimo] = { label: trail[ultimo].label, icon: trail[ultimo].icon };
  }

  return trail;
}
