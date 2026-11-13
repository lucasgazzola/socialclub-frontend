import { CalendarClock, Layers, Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, HeaderOrdenable } from '@/components/ui';
import type { SentidoOrden } from '@/components/ui';
import {
  MODALIDAD_RESERVA_LABELS,
  TIPO_ESPACIO_LABELS,
  type Espacio,
} from '../types';

export type CampoOrdenEspacio = 'nombre' | 'tipo' | 'capacidadMaxima' | 'precio' | 'montoSena';

interface EspaciosTableProps {
  espacios: Espacio[];
  puedeMutar: boolean;
  ordenarPor?: CampoOrdenEspacio;
  orden?: SentidoOrden;
  onOrdenar?: (campo: CampoOrdenEspacio) => void;
  onEditar?: (espacio: Espacio) => void;
  onEliminar?: (espacio: Espacio) => void;
  onConfigurarBloqueo?: (espacio: Espacio) => void;
}

function formatMoneda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const num = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(num)) return '—';
  return `$${num.toLocaleString('es-AR')}`;
}

function resumirSubespacios(espacio: Espacio): string | null {
  const subs = espacio.subespacios ?? [];
  const total = subs.length || espacio._count?.subespacios || 0;
  if (total === 0) return null;
  if (subs.length === 1) return `1 sub-espacio (${subs[0].nombre})`;
  if (subs.length === 2) return `2 sub-espacios (${subs[0].nombre}, ${subs[1].nombre})`;
  if (subs.length >= 3) {
    return `${subs.length} sub-espacios (${subs[0].nombre} … ${subs[subs.length - 1].nombre})`;
  }
  return `${total} sub-espacios`;
}

export function EspaciosTable({
  espacios,
  puedeMutar,
  ordenarPor,
  orden,
  onOrdenar,
  onEditar,
  onEliminar,
  onConfigurarBloqueo,
}: EspaciosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <HeaderOrdenable
                campo="nombre"
                label="Espacio"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="tipo"
                label="Tipo"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="capacidadMaxima"
                label="Capacidad"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <th className="px-5 py-3.5 text-left">Modalidad</th>
              <th className="px-5 py-3.5 text-left">Disciplinas</th>
              <HeaderOrdenable
                campo="precio"
                label="Alquiler / Seña"
                align="right"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <th className="px-5 py-3.5 text-left">Estado</th>
              {puedeMutar && <th className="px-5 py-3.5 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {espacios.map((espacio) => {
              const disciplinasNombres =
                espacio.disciplinas?.map((d) => d.disciplina.nombre) ?? [];
              const resumenComposite = resumirSubespacios(espacio);

              return (
                <tr
                  key={espacio.id}
                  className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/70"
                  data-testid={`espacio-row-${espacio.id}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{espacio.nombre}</div>
                    {espacio.ubicacion && (
                      <div className="text-xs text-slate-500">{espacio.ubicacion}</div>
                    )}
                    {resumenComposite && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <Layers size={12} aria-hidden="true" />
                        <span>{resumenComposite}</span>
                      </div>
                    )}
                    {espacio.espacioPadre && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        Pertenece a: {espacio.espacioPadre.nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {TIPO_ESPACIO_LABELS[espacio.tipo] ?? espacio.tipo}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                    {espacio.capacidadMaxima} pers.
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {MODALIDAD_RESERVA_LABELS[espacio.modalidad] ?? espacio.modalidad}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {espacio.tipo === 'SOCIAL' || disciplinasNombres.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {disciplinasNombres.map((nom) => (
                          <span
                            key={nom}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {nom}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    <div className="font-semibold text-slate-900">
                      {formatMoneda(espacio.precio)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Seña {formatMoneda(espacio.montoSena)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={espacio.activo ? 'success' : 'secondary'}>
                      {espacio.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  {puedeMutar && (
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditar?.(espacio)}
                          title="Editar espacio y bloqueos"
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onConfigurarBloqueo?.(espacio)}
                          title="Configurar nuevo bloqueo"
                        >
                          <CalendarClock size={14} aria-hidden="true" />
                          Bloqueos
                        </Button>
                        {espacio.activo && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => onEliminar?.(espacio)}
                            title="Dar de baja este espacio"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Dar de baja
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
