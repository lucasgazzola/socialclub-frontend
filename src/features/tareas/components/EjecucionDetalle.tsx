import { Badge, type BadgeVariant } from '@/components/ui';
import type { EjecucionTarea, EstadoEjecucion } from '../types';

const ESTADO: Record<EstadoEjecucion, { texto: string; variante: BadgeVariant }> = {
  EN_CURSO: { texto: 'En curso', variante: 'brand' },
  EXITOSA: { texto: 'Exitosa', variante: 'success' },
  FALLIDA: { texto: 'Fallida', variante: 'danger' },
  OMITIDA: { texto: 'Omitida', variante: 'secondary' },
};

/** Nombres legibles de los contadores, en el orden en que se muestran. */
const ETIQUETAS: Record<string, string> = {
  alertas: 'Alertas',
  nuevas: 'Nuevas',
  destinatarios: 'Destinatarios',
  creadas: 'Creadas',
  enviadas: 'Enviadas',
  fallidas: 'Fallidas',
  pendientes: 'Pendientes',
  revisadas: 'Revisadas',
  periodo: 'Período',
  categorias: 'Categorías',
  activadas: 'Activadas',
  desactivadas: 'Desactivadas',
};

export function EstadoEjecucionBadge({ estado }: { estado: EstadoEjecucion }) {
  const { texto, variante } = ESTADO[estado];
  return <Badge variant={variante}>{texto}</Badge>;
}

/** Resumen de la ejecución: contadores o el error. */
export function ResultadoEjecucion({ ejecucion }: { ejecucion: EjecucionTarea }) {
  if (ejecucion.error) {
    return (
      <span className={ejecucion.estado === 'FALLIDA' ? 'text-rose-700' : 'text-slate-500'}>
        {ejecucion.error}
      </span>
    );
  }
  // La base devuelve el JSON con las claves reordenadas: se muestran en un orden fijo.
  const orden = Object.keys(ETIQUETAS);
  const posicion = (clave: string) => (orden.includes(clave) ? orden.indexOf(clave) : orden.length);
  const datos = Object.entries(ejecucion.resultado ?? {}).sort(
    ([a], [b]) => posicion(a) - posicion(b),
  );
  if (!datos.length) return <span className="text-slate-400">—</span>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {datos.map(([clave, valor]) => (
        <span key={clave} className="whitespace-nowrap text-slate-600">
          {ETIQUETAS[clave] ?? clave}: <strong className="font-semibold text-slate-900">{String(valor)}</strong>
        </span>
      ))}
    </span>
  );
}
