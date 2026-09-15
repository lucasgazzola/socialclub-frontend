import { BadgeAlertIcon, BadgeCheck, Edit3, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import type { Usuario } from '../types';

/**
 * Plantilla de columnas de la grilla, compartida entre el encabezado y las
 * filas: si cambia acá, cambia en los dos lugares. Por debajo de `lg` no
 * aplica — ahí cada fila se apila como tarjeta.
 *
 * Los seis tracks tienen que resolver a un ancho independiente del contenido,
 * porque el encabezado y las filas son dos grillas separadas: un track `auto`
 * lo dimensiona cada una según lo suyo ("Estado" mide mucho menos que el pill,
 * "Acciones" menos que los botones) y ese desfase se propaga al reparto de los
 * `fr`, desalineando todas las columnas. De ahí que cada track sea
 * `minmax(<mínimo fijo>, <n>fr)` o directamente un ancho fijo.
 *
 * El mínimo además evita que una columna se comprima tanto que su contenido
 * se derrame sobre la siguiente. La suma de mínimos (53rem) + los gaps
 * (3,75rem) + el padding (2,5rem) es el `ANCHO_MINIMO` de abajo, 59,25rem.
 * Roles arranca en 8rem para que los dos chips más habituales entren en una
 * línea; con más roles envuelve y la fila crece, que es lo esperable.
 * El nombre se lleva el mínimo más grande
 * porque es el dato con el que se identifica la fila.
 */
const COLUMNAS =
  'lg:grid-cols-[minmax(12.5rem,1.8fr)_minmax(8rem,1.6fr)_minmax(5.25rem,0.8fr)_minmax(8rem,1.1fr)_6.25rem_13rem]';

/**
 * Ancho al que la grilla deja de comprimirse y pasa a scrollear dentro de su
 * contenedor. Con la barra lateral (w-60) y el padding del layout (p-8), recién
 * a partir de ~1160px de viewport entra sin scroll.
 */
const ANCHO_MINIMO = 'lg:min-w-[59.25rem]';

/** Etiqueta de campo, visible solo en la versión tarjeta. */
function EtiquetaMobile({ children }: { children: string }) {
  return (
    <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
      {children}
    </span>
  );
}

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
 * Grilla de usuarios administrativos (componente "tonto").
 *
 * En desktop es una grilla de columnas alineadas al estilo de las demás
 * pantallas de gestión; por debajo de `lg` las mismas filas se apilan como
 * tarjetas. El markup es único: lo que cambia es la ubicación de cada celda,
 * así no se duplica contenido ni se repite información para lectores de
 * pantalla.
 */
export function UsuariosGrid({
  usuarios,
  usuarioDestacadoId = null,
  accionesDeshabilitadas = false,
  onEditar,
  onCambiarEstado,
}: UsuariosGridProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* El scroll vive acá para que encabezado y filas se desplacen juntos y
          la página nunca scrollee de costado. */}
      <div className="overflow-x-auto">
        <div className={ANCHO_MINIMO}>
          <div
            aria-hidden="true"
            className={cn(
              'hidden gap-x-3 border-b border-slate-200 bg-slate-50 px-5 py-3',
              'text-xs font-medium uppercase tracking-wide text-slate-500 lg:grid',
              COLUMNAS,
            )}
          >
            <span>Usuario</span>
            <span>Email</span>
            <span>DNI</span>
            <span>Roles</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {usuarios.map((usuario) => {
              const destacado = usuario.id === usuarioDestacadoId;
              const roles = usuario.roles.map((rol) => rol.rol.nombre);
              const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;

              return (
                <li
                  key={usuario.id}
                  aria-current={destacado ? 'true' : undefined}
                  className={cn(
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-4 transition-colors',
                    'lg:gap-y-0 lg:px-5 lg:py-3',
                    COLUMNAS,
                    destacado
                      ? 'bg-brand-50/70 ring-1 ring-inset ring-brand-200'
                      : 'hover:bg-slate-50',
                  )}
                >
                  {/* 1 · Identidad */}
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
                    <span className="truncate font-semibold text-slate-900" title={nombreCompleto}>
                      {nombreCompleto}
                    </span>
                  </div>

                  {/* 5 · Estado (arriba a la derecha en la versión tarjeta) */}
                  <div className="col-start-2 row-start-1 justify-self-end lg:col-start-5 lg:row-start-1 lg:justify-self-start">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                        usuario.activo
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-500',
                      )}
                    >
                      {usuario.activo ? <BadgeCheck size={12} /> : <BadgeAlertIcon size={12} />}
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* 2 · Email — el truncado va en la celda (bloque), no en el
                      span: un span inline ignora text-overflow y se derrama
                      sobre la columna siguiente. */}
                  <div
                    className="col-span-2 col-start-1 row-start-2 min-w-0 truncate lg:col-span-1 lg:col-start-2 lg:row-start-1"
                    title={usuario.email}
                  >
                    <EtiquetaMobile>Email</EtiquetaMobile>
                    <span className="text-sm text-slate-600">{usuario.email}</span>
                  </div>

                  {/* 3 · DNI */}
                  <div className="col-span-2 col-start-1 row-start-3 whitespace-nowrap lg:col-span-1 lg:col-start-3 lg:row-start-1">
                    <EtiquetaMobile>DNI</EtiquetaMobile>
                    <span className="text-sm tabular-nums text-slate-600">
                      {formatearDni(usuario.dni)}
                    </span>
                  </div>

                  {/* 4 · Roles */}
                  <div className="col-span-2 col-start-1 row-start-4 flex flex-wrap items-center gap-1.5 lg:col-span-1 lg:col-start-4 lg:row-start-1">
                    {roles.length === 0 ? (
                      <span className="text-sm text-slate-400">Sin roles</span>
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

                  {/* 6 · Acciones */}
                  <div className="col-span-2 col-start-1 row-start-5 flex gap-2 lg:col-span-1 lg:col-start-6 lg:row-start-1 lg:justify-self-end">
                    <Button variant="secondary" size="sm" onClick={() => onEditar(usuario)}>
                      <Edit3 size={14} />
                      Editar
                    </Button>
                    <Button
                      variant={usuario.activo ? 'danger' : 'success'}
                      size="sm"
                      disabled={accionesDeshabilitadas}
                      onClick={() => onCambiarEstado(usuario)}
                    >
                      {usuario.activo ? <UserRoundX size={14} /> : <UserRoundCheck size={14} />}
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
