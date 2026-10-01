import { Edit2, RotateCcw, X } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import {
  GENERO_DISCIPLINA_LABELS,
  describirAniosNacimiento,
  describirEdad,
  etiquetaTipoDocumento,
  restriccionesEfectivas,
  type CategoriaDisciplinaDetalle,
  type RequerimientoDoc,
  type Restricciones,
} from '../types';

interface CategoriasTableProps {
  categorias: CategoriaDisciplinaDetalle[];
  requerimientosDisciplina: RequerimientoDoc[];
  restriccionesDisciplina: Restricciones;
  puedeMutar: boolean;
  accionesDeshabilitadas?: boolean;
  onEditar: (categoria: CategoriaDisciplinaDetalle) => void;
  onCambiarEstado: (categoria: CategoriaDisciplinaDetalle) => void;
}

/** US-51: nombre, restricciones que rigen, documentación total exigida (disciplina + categoría) y estado. */
export function CategoriasTable({ categorias, requerimientosDisciplina, restriccionesDisciplina, puedeMutar, accionesDeshabilitadas = false, onEditar, onCambiarEstado }: CategoriasTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Nombre</th>
              <th className="px-5 py-3 font-semibold">Restricciones</th>
              <th className="px-5 py-3 font-semibold">Documentación exigida</th>
              <th className="px-5 py-3 font-semibold">Inscriptos</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              {puedeMutar && <th className="px-5 py-3 text-right font-semibold">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categorias.map((categoria) => {
              const total = requerimientosDisciplina.length + categoria.requerimientosDoc.length;
              const efectivas = restriccionesEfectivas(restriccionesDisciplina, categoria);
              const anios = describirAniosNacimiento(efectivas);
              return (
                <tr key={categoria.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-900">{categoria.nombre}</td>
                  <td className="px-5 py-4 text-slate-600">
                    <span className="block">{efectivas.genero ? GENERO_DISCIPLINA_LABELS[efectivas.genero] : 'Cualquier género'} · {describirEdad(efectivas)}</span>
                    {anios && <span className="block text-xs text-slate-400">{anios}</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {total === 0 ? (
                      'No requiere'
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {requerimientosDisciplina.map((requisito) => (
                          <Badge key={`d-${requisito.tipoDocumento}`} variant="secondary" title="Exigido por la disciplina">
                            {etiquetaTipoDocumento(requisito.tipoDocumento)}
                          </Badge>
                        ))}
                        {categoria.requerimientosDoc.map((requisito) => (
                          <Badge key={`c-${requisito.tipoDocumento}`} variant="brand" title="Adicional de la categoría">
                            {etiquetaTipoDocumento(requisito.tipoDocumento)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{categoria._count.inscripciones}</td>
                  <td className="px-5 py-4">
                    <Badge variant={categoria.activo ? 'success' : 'secondary'}>{categoria.activo ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                  {puedeMutar && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <Button type="button" variant="ghost" size="sm" disabled={accionesDeshabilitadas} onClick={() => onEditar(categoria)} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                          <Edit2 size={14} /> Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={accionesDeshabilitadas}
                          onClick={() => onCambiarEstado(categoria)}
                          className={categoria.activo ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}
                        >
                          {categoria.activo ? <X size={14} /> : <RotateCcw size={14} />}
                          {categoria.activo ? 'Dar de baja' : 'Reactivar'}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
