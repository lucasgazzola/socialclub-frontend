import { useEffect, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, Layers, Pencil, RotateCcw, Trash2 } from 'lucide-react';
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
  const [tooltip, setTooltip] = useState<{ texto: string; top: number; left: number } | null>(null);

  useEffect(() => {
    const hideTooltip = () => setTooltip(null);
    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('resize', hideTooltip);
    return () => {
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('resize', hideTooltip);
    };
  }, []);

  const handleMouseEnter = (e: MouseEvent<HTMLSpanElement>, texto: string) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;
    const rect = el.getBoundingClientRect();
    setTooltip({
      texto,
      top: rect.bottom + 8,
      left: Math.max(16, Math.min(rect.left, window.innerWidth - 360)),
    });
  };

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
                  <td className="max-w-55 px-5 py-4 text-slate-500">
                    {disciplina.descripcion ? (
                      <div className="flex items-center">
                        <span
                          className="w-full cursor-help truncate"
                          onMouseEnter={(e) => handleMouseEnter(e, disciplina.descripcion!)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {disciplina.descripcion}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
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
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Layers size={14} /> Categorías ({disciplina.categorias.length})
                      </Link>
                      {puedeMutar && (<>
                        <Button type="button" variant="ghost" size="sm" disabled={accionesDeshabilitadas} onClick={() => onEditar(disciplina)} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                          <Pencil size={14} /> Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={accionesDeshabilitadas}
                          onClick={() => onCambiarEstado(disciplina)}
                          className={`w-28 justify-start ${disciplina.activo ? 'hover:bg-rose-50 hover:text-rose-700' : 'hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                          {disciplina.activo ? <Trash2 size={14} /> : <RotateCcw size={14} />}
                          {disciplina.activo ? 'Dar de baja' : 'Reactivar'}
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

      {tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] w-max max-w-[280px] sm:max-w-md rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: tooltip.top, left: tooltip.left }}
          >
            <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">
              {tooltip.texto}
            </p>
          </div>,
          document.body,
        )}
    </Card>
  );
}
