import { Pencil, UserRoundCheck, UserMinus } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import type { Usuario } from '../types';



function iniciales(usuario: Usuario): string {
  return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
}

/** Agrupa el DNI de a miles para que sea más fácil de leer (25.123.456). */
function formatearDni(dni?: string | null): string {
  if (!dni) {
    return 'Sin dato';
  }
  return /^\d+$/.test(dni) ? Number(dni).toLocaleString('es-AR') : dni;
}

interface UsuariosGridProps {
  usuarios: Usuario[];
  /** Usuario cuyo estado se cambió último: se muestra primero y resaltado (DT-03). */
  usuarioDestacadoId?: number | null;
  /** Deshabilita las acciones de estado mientras hay una mutación en curso. */
  accionesDeshabilitadas?: boolean;
  onEditar: (usuario: Usuario) => void;
  onCambiarEstado: (usuario: Usuario) => void;
}

/**
 * Tabla de usuarios administrativos, siguiendo exactamente el patrón y dimensiones de SociosTable.
 */
export function UsuariosGrid({
  usuarios,
  usuarioDestacadoId = null,
  accionesDeshabilitadas = false,
  onEditar,
  onCambiarEstado,
}: UsuariosGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Usuario</th>
              <th className="px-5 py-3.5">DNI</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Roles</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
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
                    {formatearDni(usuario.dni)}
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
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={usuario.activo ? 'success' : 'danger'}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => onEditar(usuario)}>
                        <Pencil size={14} />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          usuario.activo
                            ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }
                        disabled={accionesDeshabilitadas}
                        onClick={() => onCambiarEstado(usuario)}
                      >
                        {usuario.activo ? <UserMinus size={14} /> : <UserRoundCheck size={14} />}
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
