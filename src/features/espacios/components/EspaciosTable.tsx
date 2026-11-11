import { Layers, Pencil, RotateCcw, Trash2 } from 'lucide-react';
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
  onEditar?: (espacio: Espacio, initialTab?: 'datos' | 'subespacios' | 'bloqueos') => void;
  onEliminar?: (espacio: Espacio) => void;
  onReactivar?: (espacio: Espacio) => void;
}

function formatMoneda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const num = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(num)) return '—';
  return `$${num.toLocaleString('es-AR')}`;
}

function resumirSubespacios(espacio: Espacio): { etiqueta: string; detalle: string } | null {
  const subs = espacio.subespacios ?? [];
  const total = subs.length || espacio._count?.subespacios || 0;
  if (total === 0) return null;
  const etiqueta = total === 1 ? '1 sub-espacio' : `${total} sub-espacios`;
  const detalle =
    subs.length > 0 ? subs.map((s) => s.nombre).join(', ') : etiqueta;
  return { etiqueta, detalle };
}

export function EspaciosTable({
  espacios,
  puedeMutar,
  ordenarPor,
  orden,
  onOrdenar,
  onEditar,
  onEliminar,
  onReactivar,
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
                className="px-4 py-3"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="tipo"
                label="Tipo"
                className="px-4 py-3 whitespace-nowrap"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="capacidadMaxima"
                label="Capacidad"
                className="px-4 py-3 whitespace-nowrap"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <th className="px-4 py-3 text-left whitespace-nowrap">Modalidad</th>
              <th className="px-4 py-3 text-left">Disciplinas</th>
              <HeaderOrdenable
                campo="precio"
                label="Alquiler / Seña"
                align="right"
                className="px-4 py-3 whitespace-nowrap"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <th className="px-4 py-3 text-left">Estado</th>
              {puedeMutar && <th className="px-4 py-3 text-right">Acciones</th>}
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-900">{espacio.nombre}</span>
                      {resumenComposite && (
                        <button
                          type="button"
                          onClick={() => onEditar?.(espacio, 'subespacios')}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer"
                          title={`Gestionar sub-espacios: ${resumenComposite.detalle}`}
                        >
                          <Layers size={11} aria-hidden="true" className="shrink-0" />
                          <span>{resumenComposite.etiqueta}</span>
                        </button>
                      )}
                    </div>
                    {espacio.ubicacion && (
                      <div className="mt-0.5 text-xs text-slate-500">{espacio.ubicacion}</div>
                    )}
                    {espacio.espacioPadre && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        Pertenece a: {espacio.espacioPadre.nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {TIPO_ESPACIO_LABELS[espacio.tipo] ?? espacio.tipo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                    {espacio.capacidadMaxima} pers.
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {MODALIDAD_RESERVA_LABELS[espacio.modalidad] ?? espacio.modalidad}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {espacio.tipo === 'SOCIAL' || disciplinasNombres.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {disciplinasNombres.map((nom) => (
                          <span
                            key={nom}
                            className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {nom}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums">
                    <div className="font-semibold text-slate-900">
                      {formatMoneda(espacio.precio)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Seña {formatMoneda(espacio.montoSena)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={espacio.activo ? 'success' : 'secondary'}>
                      {espacio.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  {puedeMutar && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
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
                        {espacio.activo ? (
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
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:bg-emerald-50"
                            onClick={() => onReactivar?.(espacio)}
                            title="Reactivar este espacio"
                          >
                            <RotateCcw size={14} aria-hidden="true" />
                            Reactivar
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
