import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, UserCheck, UserMinus } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { formatearDni } from '@/lib/utils/dni';
import type { CriterioOrden, SentidoOrden, Usuario } from '../types';

function iniciales(usuario: Usuario): string {
  return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
}

/** Formatea la fecha ISO a dd/mm/aaaa legible para Argentina */
function formatearFecha(iso?: string | null): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface HeaderOrdenableProps {
  campo: CriterioOrden;
  label: string;
  ordenarPor?: CriterioOrden;
  orden?: SentidoOrden;
  onOrdenar?: (campo: CriterioOrden) => void;
  className?: string;
}

function HeaderOrdenable({
  campo,
  label,
  ordenarPor,
  orden,
  onOrdenar,
  className,
}: HeaderOrdenableProps) {
  const activo = Boolean(ordenarPor && ordenarPor === campo && orden);

  return (
    <th
      aria-sort={activo ? (orden === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-5 py-3.5', className)}
    >
      <button
        type="button"
        onClick={() => onOrdenar?.(campo)}
        title={`Ordenar por ${label}`}
        className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors select-none focus:outline-hidden"
      >
        <span>{label}</span>
        <span className="flex items-center" aria-hidden="true">
          {activo ? (
            orden === 'asc' ? (
              <ArrowUp size={13} className="text-brand-600 stroke-[2.5]" />
            ) : (
              <ArrowDown size={13} className="text-brand-600 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown
              size={13}
              className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity"
            />
          )}
        </span>
      </button>
    </th>
  );
}

interface UsuariosGridProps {
  usuarios: Usuario[];
  /** Usuario cuyo estado se cambió último: se muestra primero y resaltado (DT-03). */
  usuarioDestacadoId?: number | null;
  /** Deshabilita las acciones de estado mientras hay una mutación en curso. */
  accionesDeshabilitadas?: boolean;
  ordenarPor?: CriterioOrden;
  orden?: SentidoOrden;
  onOrdenar?: (campo: CriterioOrden) => void;
  onEditar: (usuario: Usuario) => void;
  onCambiarEstado: (usuario: Usuario) => void;
}

/**
 * Tabla de usuarios administrativos con soporte para ordenamiento interactivo por columnas.
 */
export function UsuariosGrid({
  usuarios,
  usuarioDestacadoId = null,
  accionesDeshabilitadas = false,
  ordenarPor,
  orden,
  onOrdenar,
  onEditar,
  onCambiarEstado,
}: UsuariosGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <HeaderOrdenable
                campo="nombre"
                label="Usuario"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="dni"
                label="DNI"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="email"
                label="Email"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="roles"
                label="Roles"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="estado"
                label="Estado"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <HeaderOrdenable
                campo="fecha"
                label="Alta"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <th className="px-5 py-3.5 text-right font-semibold uppercase tracking-wider text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody role="list">
            {usuarios.map((usuario) => {
              const destacado = usuario.id === usuarioDestacadoId;
              const roles = usuario.roles.map((rol) => rol.rol.nombre);
              const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;

              return (
                <tr
                  key={usuario.id}
                  role="listitem"
                  aria-current={destacado ? 'true' : undefined}
                  className={cn(
                    'border-b border-slate-100 last:border-b-0 transition-[background-color] duration-150 hover:bg-slate-50/70',
                    destacado && 'bg-brand-50/70',
                  )}
                >
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          usuario.activo
                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
                            : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200',
                        )}
                      >
                        {iniciales(usuario)}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-900" title={nombreCompleto}>
                        {nombreCompleto}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                    {formatearDni(usuario.dni, 'Sin dato')}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {usuario.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {roles.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        roles.map((rol) => (
                          <span
                            key={rol}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {rol}
                          </span>
                        ))
                      )}
                    </div>
                    {/* DT-42: disciplinas a cargo del delegado. */}
                    {usuario.disciplinas && usuario.disciplinas.length > 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        {usuario.disciplinas.map((d) => d.nombre).join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={usuario.activo ? 'success' : 'danger'}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 tabular-nums">
                    {formatearFecha(usuario.creadoEn)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => onEditar(usuario)}>
                        <Pencil size={14} className="shrink-0" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-[102px] justify-start',
                          usuario.activo
                            ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
                        )}
                        disabled={accionesDeshabilitadas}
                        onClick={() => onCambiarEstado(usuario)}
                      >
                        {usuario.activo ? (
                          <UserMinus size={14} className="shrink-0" />
                        ) : (
                          <UserCheck size={14} className="shrink-0" />
                        )}
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
