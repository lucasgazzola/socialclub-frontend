import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Clock,
  Dumbbell,
  Filter,
  Layers,
  MapPin,
  PartyPopper,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Select } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import {
  MODALIDAD_RESERVA_LABELS,
  TIPO_ESPACIO_LABELS,
  calcularPrecioSocio,
  obtenerDescuentoSocio,
  type Espacio,
  type ModalidadReserva,
  type TipoEspacio,
} from '../types';

interface EspaciosCatalogoProps {
  espacios: Espacio[];
  cargando?: boolean;
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  tipoFiltro: TipoEspacio | '';
  onTipoFiltroChange: (val: TipoEspacio | '') => void;
  modalidadFiltro: ModalidadReserva | '';
  onModalidadFiltroChange: (val: ModalidadReserva | '') => void;
  capacidadMinFiltro: number | '';
  onCapacidadMinFiltroChange: (val: number | '') => void;
  onLimpiarFiltros: () => void;
  esSocio?: boolean;
}

function formatMoneda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const num = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(num)) return '—';
  return `$${num.toLocaleString('es-AR')}`;
}

function IconoTipo({ tipo }: { tipo: TipoEspacio }) {
  switch (tipo) {
    case 'DEPORTIVO':
      return <Dumbbell className="text-emerald-600" size={24} aria-hidden="true" />;
    case 'SOCIAL':
      return <PartyPopper className="text-blue-600" size={24} aria-hidden="true" />;
    case 'MULTIUSO':
    default:
      return <Building2 className="text-amber-600" size={24} aria-hidden="true" />;
  }
}

function colorFondoTipo(tipo: TipoEspacio): string {
  switch (tipo) {
    case 'DEPORTIVO':
      return 'from-emerald-500/10 to-teal-500/5 text-emerald-800';
    case 'SOCIAL':
      return 'from-blue-500/10 to-indigo-500/5 text-blue-800';
    case 'MULTIUSO':
    default:
      return 'from-amber-500/10 to-orange-500/5 text-amber-800';
  }
}

export function EspaciosCatalogo({
  espacios,
  cargando = false,
  busqueda,
  onBusquedaChange,
  tipoFiltro,
  onTipoFiltroChange,
  modalidadFiltro,
  onModalidadFiltroChange,
  capacidadMinFiltro,
  onCapacidadMinFiltroChange,
  onLimpiarFiltros,
  esSocio = false,
}: EspaciosCatalogoProps) {
  const navigate = useNavigate();
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<Espacio | null>(null);

  const tieneFiltros = Boolean(
    busqueda || tipoFiltro || modalidadFiltro || capacidadMinFiltro !== '',
  );

  return (
    <div className="space-y-6">
      {/* Barra de Filtros del Catálogo */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="w-full">
            <Input
              id="catalogo-busqueda"
              placeholder="Buscar por nombre o ubicación..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              leftIcon={<Search />}
            />
          </div>

          <Select
            id="catalogo-filtro-tipo"
            aria-label="Filtrar por tipo"
            value={tipoFiltro}
            onChange={(e) => onTipoFiltroChange(e.target.value as TipoEspacio | '')}
            leftIcon={<Filter />}
          >
            <option value="">Todos los tipos</option>
            <option value="DEPORTIVO">Deportivo</option>
            <option value="SOCIAL">Social</option>
            <option value="MULTIUSO">Multiuso</option>
          </Select>

          <Select
            id="catalogo-filtro-modalidad"
            aria-label="Filtrar por modalidad"
            value={modalidadFiltro}
            onChange={(e) => onModalidadFiltroChange(e.target.value as ModalidadReserva | '')}
            leftIcon={<Clock />}
          >
            <option value="">Todas las modalidades</option>
            <option value="POR_HORA">Por hora</option>
            <option value="DIA_COMPLETO">Día completo</option>
          </Select>

          <Select
            id="catalogo-filtro-capacidad"
            aria-label="Filtrar por capacidad mínima"
            value={capacidadMinFiltro === '' ? '' : String(capacidadMinFiltro)}
            onChange={(e) =>
              onCapacidadMinFiltroChange(e.target.value === '' ? '' : Number(e.target.value))
            }
            leftIcon={<Users />}
          >
            <option value="">Cualquier capacidad</option>
            <option value="10">Mínimo 10 personas</option>
            <option value="30">Mínimo 30 personas</option>
            <option value="50">Mínimo 50 personas</option>
            <option value="100">Mínimo 100 personas</option>
          </Select>
        </div>

        {tieneFiltros && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Filtros aplicados para catálogo</span>
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
            >
              <X size={14} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Listado de Tarjetas o Estado Vacío */}
      {espacios.length === 0 && !cargando ? (
        <Card className="p-12 text-center text-slate-500">
          <Building2 className="mx-auto mb-3 text-slate-300" size={36} />
          <h3 className="text-base font-semibold text-slate-800">No se encontraron resultados</h3>
          <p className="mt-1 text-sm text-slate-500">
            No encontramos ningún espacio físico que coincida con los criterios de búsqueda.
          </p>
          {tieneFiltros && (
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={onLimpiarFiltros}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {espacios.map((espacio) => {
            const subs = espacio.subespacios ?? [];
            const cantSubs = subs.length || espacio._count?.subespacios || 0;
            const disciplinasNombres =
              espacio.disciplinas?.map((d) => d.disciplina.nombre) ?? [];

            const unidadTiempo = espacio.modalidad === 'POR_HORA' ? 'hora' : 'día';
            const precioGralNum = Number(espacio.precio);
            const descSocio = espacio.descuentoSocio ?? obtenerDescuentoSocio(espacio);
            const precioSocioNum =
              descSocio > 0
                ? calcularPrecioSocio(precioGralNum, descSocio)
                : espacio.precioSocio
                ? Number(espacio.precioSocio)
                : null;

            return (
              <div
                key={espacio.id}
                data-testid={`catalogo-card-${espacio.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
              >
                <div>
                  {/* Banner / Cabecera de la Tarjeta */}
                  <div
                    className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${colorFondoTipo(
                      espacio.tipo,
                    )} p-4`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-xs backdrop-blur-xs">
                      <IconoTipo tipo={espacio.tipo} />
                    </div>

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="bg-white/80 backdrop-blur-xs font-medium">
                        {TIPO_ESPACIO_LABELS[espacio.tipo]}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/80 backdrop-blur-xs font-medium">
                        {MODALIDAD_RESERVA_LABELS[espacio.modalidad]}
                      </Badge>
                    </div>

                    {cantSubs > 0 && (
                      <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs font-medium text-white shadow-xs backdrop-blur-xs">
                        <Layers size={12} aria-hidden="true" />
                        <span>{cantSubs} sub-unidades</span>
                      </div>
                    )}
                  </div>

                  {/* Cuerpo */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                      {espacio.nombre}
                    </h3>

                    {espacio.ubicacion && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{espacio.ubicacion}</span>
                      </div>
                    )}

                    {espacio.descripcion && (
                      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {espacio.descripcion}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Users size={15} className="text-slate-400" aria-hidden="true" />
                      <span>Capacidad máxima:</span>
                      <span className="font-semibold text-slate-900">
                        {espacio.capacidadMaxima} personas
                      </span>
                    </div>

                    {/* Chips de Disciplinas compatibles si es deportivo */}
                    {espacio.tipo === 'DEPORTIVO' && disciplinasNombres.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {disciplinasNombres.map((disc) => (
                          <span
                            key={disc}
                            className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/10"
                          >
                            {disc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tarifas Diferenciadas */}
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/75 p-3 text-xs">
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-500">Tarifa para socios:</span>
                        <span className="font-bold text-slate-900">
                          {formatMoneda(precioSocioNum ?? precioGralNum)}{' '}
                          {descSocio > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700">
                              ({descSocio}% OFF)
                            </span>
                          )}{' '}
                          <span className="font-normal text-slate-500">/ {unidadTiempo}</span>
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-slate-500">Tarifa general (no socio):</span>
                        <span className="font-medium text-slate-700">
                          {formatMoneda(precioGralNum)}{' '}
                          <span className="font-normal text-slate-400">/ {unidadTiempo}</span>
                        </span>
                      </div>
                      <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-between font-medium text-slate-600">
                        <span>Seña de reserva:</span>
                        <span className="font-semibold text-brand-600">
                          {formatMoneda(espacio.montoSena)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie de tarjeta con Botón de Solicitud de Alquiler */}
                <div className="border-t border-slate-100 bg-white p-4">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    onClick={() => setEspacioSeleccionado(espacio)}
                  >
                    <Calendar size={15} aria-hidden="true" />
                    Solicitar alquiler
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal informativo para solicitar alquiler */}
      <Modal
        open={espacioSeleccionado !== null}
        title="Solicitud de alquiler de espacio"
        description={espacioSeleccionado ? `Reservar ${espacioSeleccionado.nombre}` : undefined}
        onClose={() => setEspacioSeleccionado(null)}
        icon={<Calendar />}
        size="md"
      >
        {espacioSeleccionado && (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-xs text-brand-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles size={16} className="text-brand-600 shrink-0" />
                <span>Información del alquiler</span>
              </div>
              <p>
                Para confirmar la disponibilidad horaria del espacio{' '}
                <strong>{espacioSeleccionado.nombre}</strong> y registrar la solicitud de alquiler,
                el club validará la agenda deportiva regular y eventos programados.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 font-medium">
                <div>
                  Modalidad:{' '}
                  <strong>{MODALIDAD_RESERVA_LABELS[espacioSeleccionado.modalidad]}</strong>
                </div>
                <div>
                  Capacidad:{' '}
                  <strong>{espacioSeleccionado.capacidadMaxima} personas</strong>
                </div>
                <div>
                  Tarifa {esSocio ? 'socio' : 'general'}:{' '}
                  <strong>
                    {formatMoneda(
                      esSocio
                        ? (espacioSeleccionado.descuentoSocio ?? obtenerDescuentoSocio(espacioSeleccionado)) > 0
                          ? calcularPrecioSocio(
                              Number(espacioSeleccionado.precio),
                              espacioSeleccionado.descuentoSocio ?? obtenerDescuentoSocio(espacioSeleccionado),
                            )
                          : espacioSeleccionado.precioSocio ?? espacioSeleccionado.precio
                        : espacioSeleccionado.precio,
                    )}
                  </strong>
                </div>
                <div>
                  Seña requerida:{' '}
                  <strong>{formatMoneda(espacioSeleccionado.montoSena)}</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Podés continuar a la sección de solicitudes de reservas para completar el horario,
              motivo y comprobante de seña.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEspacioSeleccionado(null)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEspacioSeleccionado(null);
                  navigate(ROUTES.solicitudesReserva);
                }}
              >
                Ir a reservas
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
