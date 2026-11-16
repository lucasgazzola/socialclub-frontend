import { Check, Edit2, Layers, RotateCcw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { GENERO_DISCIPLINA_LABELS, type Disciplina } from '../types';

interface DisciplinasTableProps {
  disciplinas: Disciplina[];
  puedeMutar: boolean;
  accionesDeshabilitadas?: boolean;
  onEditar: (disciplina: Disciplina) => void;
  onCambiarEstado: (disciplina: Disciplina) => void;
}

export function DisciplinasTable({ disciplinas, puedeMutar, accionesDeshabilitadas = false, onEditar, onCambiarEstado }: DisciplinasTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Nombre</th>
              <th className="px-5 py-3 font-semibold">Descripción</th>
              <th className="px-5 py-3 font-semibold">Género</th>
              <th className="px-5 py-3 font-semibold">Edad</th>
              <th className="px-5 py-3 font-semibold">Documentación</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {disciplinas.map((disciplina) => {
              const rangoEdad = disciplina.edadMinima !== null && disciplina.edadMinima !== undefined
                ? `${disciplina.edadMinima}–${disciplina.edadMaxima ?? '∞'}`
                : disciplina.edadMaxima !== null && disciplina.edadMaxima !== undefined
                  ? `hasta ${disciplina.edadMaxima}`
                  : 'Sin límite';
              return (
                <tr key={disciplina.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-900">{disciplina.nombre}</td>
                  <td className="max-w-55 truncate px-5 py-4 text-slate-500">{disciplina.descripcion || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{disciplina.genero ? GENERO_DISCIPLINA_LABELS[disciplina.genero] : 'Sin restricción'}</td>
                  <td className="px-5 py-4 text-slate-600">{rangoEdad}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {disciplina.solicitaDocumentacion ? `${disciplina.requerimientosDoc.length} tipo(s)` : 'No requiere'}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={disciplina.activo ? 'success' : 'secondary'}>{disciplina.activo ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        to={ROUTES.categoriasDisciplina(disciplina.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Layers size={14} /> Categorías ({disciplina.categorias.length})
                      </Link>
                      {puedeMutar && (<>
                        <Button type="button" variant="ghost" size="sm" disabled={accionesDeshabilitadas} onClick={() => onEditar(disciplina)} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                          <Edit2 size={14} /> Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={accionesDeshabilitadas}
                          onClick={() => onCambiarEstado(disciplina)}
                          className={disciplina.activo ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}
                        >
                          {disciplina.activo ? <X size={14} /> : <RotateCcw size={14} />}
                          {disciplina.activo ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      </>)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {disciplinas.length === 0 && <div className="p-8 text-center text-sm text-slate-500"><Check className="mx-auto mb-2 text-slate-300" size={24} />No hay disciplinas que coincidan con el filtro.</div>}
    </Card>
  );
}
