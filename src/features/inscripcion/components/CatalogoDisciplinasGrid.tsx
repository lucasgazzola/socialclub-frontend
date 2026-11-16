import { Dumbbell, FileText, Users } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import type { DisciplinaCatalogo } from '../types';

interface Props {
  disciplinas: DisciplinaCatalogo[];
  onSeleccionar: (disciplina: DisciplinaCatalogo) => void;
  esSocio?: boolean;
}

export function CatalogoDisciplinasGrid({ disciplinas, onSeleccionar, esSocio }: Props) {
  if (disciplinas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xs" data-testid="sin-disciplinas-activas">
        <Dumbbell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700">No hay disciplinas activas disponibles en este momento.</p>
        <p className="mt-1 text-sm text-slate-500">Pronto se habilitarán nuevas actividades deportivas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" data-testid="catalogo-disciplinas-grid">
      {disciplinas.map((d) => {
        const puedeSolicitar = !d.inscripto && !d.solicitudPendiente;

        return (
          <Card
            key={d.id}
            className="flex flex-col justify-between p-5 transition-shadow hover:shadow-md"
            data-testid={`tarjeta-disciplina-${d.id}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">{d.nombre}</h3>
                {d.inscripto ? (
                  <Badge variant="success" data-testid={`badge-inscripto-${d.id}`}>
                    Inscripto
                  </Badge>
                ) : d.solicitudPendiente ? (
                  <Badge variant="warning" data-testid={`badge-solicitud-pendiente-${d.id}`}>
                    Solicitud pendiente
                  </Badge>
                ) : null}
              </div>

              {d.descripcion && (
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{d.descripcion}</p>
              )}

              {/* Arancel */}
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Arancel mensual
                </span>
                <div className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
                  ${d.arancelMensual.toLocaleString('es-AR')}
                  <span className="text-xs font-normal text-slate-500"> / mes</span>
                </div>
                {d.descuentoSocioPorcentaje > 0 && esSocio && (
                  <div className="mt-1 text-[11px] font-medium text-emerald-700">
                    Incluye {d.descuentoSocioPorcentaje}% desc. por ser socio
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-slate-400" />
                  <span>
                    {d.categorias.length > 0
                      ? `${d.categorias.length} ${d.categorias.length === 1 ? 'categoría activa' : 'categorías activas'}`
                      : 'Sin categorías divididas'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-slate-400" />
                  <span>
                    {d.documentosObligatorios.length > 0
                      ? `${d.documentosObligatorios.length} documentos obligatorios`
                      : 'No exige documentación obligatoria'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <Button
                variant={puedeSolicitar ? 'primary' : 'outline'}
                className="w-full justify-center"
                disabled={!puedeSolicitar}
                onClick={() => onSeleccionar(d)}
                data-testid={`btn-postularse-${d.id}`}
              >
                {d.inscripto
                  ? 'Ya estás inscripto'
                  : d.solicitudPendiente
                    ? 'Solicitud pendiente'
                    : 'Solicitar inscripción'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

