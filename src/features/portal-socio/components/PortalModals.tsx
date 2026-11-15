import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import {
  formatFechaEvento,
  formatPrecio,
  formatPrecioSocio,
  getEstadoVisual,
  puedeComprar,
  ventaAbierta,
} from '@/features/eventos/helpers';
import type { Evento } from '@/features/eventos/types';
import { useSolicitarInscripcion } from '@/features/inscripcion/hooks/useSolicitarInscripcion';
import {
  solicitarInscripcionSchema,
  type SolicitarInscripcionFormValues,
} from '@/features/inscripcion/schemas/solicitar-inscripcion.schema';
import type { CategoriaCatalogo, DisciplinaCatalogo } from '@/features/inscripcion/types';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalEventoVisual,
  PortalFieldSelect,
  PortalModal,
  PortalSpinner,
  PortalTag,
} from './PortalUI';

/**
 * Modal oscuro de confirmación previo a Mercado Pago / Simulador (propio del Portal de Socios).
 */
export function PortalConfirmarPagoModal({
  open,
  onClose,
  titulo,
  detalle,
  total,
  onConfirmar,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  detalle: ReactNode;
  total: number;
  onConfirmar: () => void;
  isLoading: boolean;
}) {
  return (
    <PortalModal
      open={open}
      onClose={isLoading ? () => {} : onClose}
      icon={<Lock size={16} />}
      title="Confirmar pago"
      description="Vas a completar el pago en Mercado Pago. Al finalizar, regresás automáticamente a SocialClub."
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-[2px] border border-slate-300/[0.12] bg-[#070b14] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {titulo}
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{detalle}</div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-300/[0.08] pt-3">
            <span className="text-sm font-medium text-slate-300">Monto total</span>
            <span className="text-lg font-semibold text-blue-400 tabular-nums">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-[2px] border border-blue-400/25 bg-blue-500/[0.08] p-3 text-xs text-blue-200">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-400" />
          <span>
            Pago protegido: los datos de tu tarjeta se cargan en Mercado Pago, nunca en
            SocialClub. Tenés 30 minutos para completarlo.
          </span>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-300/[0.10] pt-4">
          <PortalButton variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Cancelar
          </PortalButton>
          <PortalButton
            variant="primary"
            size="sm"
            onClick={onConfirmar}
            disabled={isLoading}
            data-testid="pagar-ir-a-pasarela"
          >
            {isLoading ? <PortalSpinner className="h-3.5 w-3.5" /> : <ExternalLink size={14} />}
            {isLoading ? 'Redirigiendo…' : 'Ir a pagar'}
          </PortalButton>
        </div>
      </div>
    </PortalModal>
  );
}

/**
 * Modal oscuro con detalle completo del evento para socios y participantes.
 */
export function PortalEventoDetalleModal({
  evento,
  open,
  onClose,
}: {
  evento: Evento | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!evento) return null;

  const estadoVisual = getEstadoVisual(evento);
  const estaEnPeriodoVenta = ventaAbierta(evento);
  const estaHabilitadoComprar = puedeComprar(evento) && estaEnPeriodoVenta;

  const precioTexto = formatPrecio(evento.precio);
  const precioSocioTexto = formatPrecioSocio(evento.precio, evento.descuentoSocio);
  const fechaInicioTexto = formatFechaEvento(evento.fechaEvento);
  const fechaFinTexto = evento.fechaFin ? formatFechaEvento(evento.fechaFin) : null;
  const inicioVentaTexto = evento.inicioVenta ? formatFechaEvento(evento.inicioVenta) : null;
  const finVentaTexto = evento.finVenta ? formatFechaEvento(evento.finVenta) : null;

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      title={evento.nombre}
      description="Información completa de la actividad y disponibilidad de entradas."
      icon={<Info size={16} />}
      size="lg"
    >
      <div className="space-y-5" data-testid="evento-detalle-modal">
        <div className="relative overflow-hidden rounded-[2px] border border-slate-300/[0.12] bg-[#070b14]">
          <PortalEventoVisual
            nombre={evento.nombre}
            imageUrl={evento.imageUrl}
            tempImageUrl={evento.tempImageUrl}
            logoSize={64}
            className="aspect-16/9 max-h-48 w-full"
          />
          <div className="absolute top-2.5 right-2.5">
            <PortalTag tone={estaHabilitadoComprar ? 'active' : 'neutral'} dot={estaHabilitadoComprar}>
              {estadoVisual.label}
            </PortalTag>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-[2px] border border-slate-300/[0.10] bg-[#070b14] p-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-medium text-slate-400">Fecha y hora</p>
              <p className="mt-0.5 text-sm font-medium text-white tabular-nums">{fechaInicioTexto}</p>
              {fechaFinTexto && (
                <p className="mt-0.5 text-xs text-slate-400 tabular-nums">Fin: {fechaFinTexto}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[2px] border border-slate-300/[0.10] bg-[#070b14] p-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-medium text-slate-400">Lugar de acreditación</p>
              <p className="mt-0.5 text-sm font-medium text-white">
                {evento.lugarAcreditacion || 'Sede del club'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[2px] border border-slate-300/[0.10] bg-[#070b14] p-3">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-medium text-slate-400">Entrada y valor</p>
              <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                {!evento.requiereEntrada ? 'Acceso libre y gratuito' : precioTexto}
              </p>
              {precioSocioTexto && (
                <p className="mt-0.5 text-xs font-medium text-blue-300 tabular-nums">
                  {precioSocioTexto}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[2px] border border-slate-300/[0.10] bg-[#070b14] p-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-medium text-slate-400">Disponibilidad</p>
              {!evento.requiereEntrada ? (
                <p className="mt-0.5 text-sm font-medium text-slate-200">Sin límite de capacidad</p>
              ) : estaEnPeriodoVenta ? (
                <p className="mt-0.5 text-sm font-medium text-white tabular-nums">
                  {evento.entradasDisponibles !== null && evento.entradasDisponibles !== undefined
                    ? `${evento.entradasDisponibles} disponibles`
                    : 'Disponibilidad abierta'}
                  {evento.capacidadMaxima ? ` (cap. ${evento.capacidadMaxima})` : ''}
                </p>
              ) : estadoVisual.key === 'VENTA_PROXIMA' ? (
                <p className="mt-0.5 text-sm font-medium text-amber-300">Venta próxima a iniciar</p>
              ) : estadoVisual.key === 'AGOTADO' ? (
                <p className="mt-0.5 text-sm font-medium text-rose-400">Entradas agotadas</p>
              ) : (
                <p className="mt-0.5 text-sm font-medium text-slate-400">No disponible</p>
              )}
            </div>
          </div>
        </div>

        {evento.requiereEntrada && (inicioVentaTexto || finVentaTexto) && (
          <div className="rounded-[2px] border border-slate-300/[0.10] bg-[#070b14] p-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-medium text-white">
              <Clock size={14} className="text-blue-400" />
              <span>Ventana de venta</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 tabular-nums">
              {inicioVentaTexto && (
                <p>
                  <span className="text-slate-400">Inicio:</span> {inicioVentaTexto}
                </p>
              )}
              {finVentaTexto && (
                <p>
                  <span className="text-slate-400">Cierre:</span> {finVentaTexto}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="text-xs font-medium text-slate-400">Descripción</h3>
          <p className="whitespace-pre-line rounded-[2px] border border-slate-300/[0.08] bg-[#070b14] p-3.5 text-sm leading-relaxed text-slate-300">
            {evento.descripcion || 'Sin descripción detallada disponible para esta actividad.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-300/[0.10] pt-4">
          <PortalButton variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </PortalButton>
          {estaHabilitadoComprar && (
            <Link
              to={ROUTES.comprarEntradas(evento.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[2px] border border-blue-400/35 bg-blue-600 px-3.5 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-blue-500 active:scale-[0.97]"
            >
              <Ticket size={14} />
              Comprar entradas
            </Link>
          )}
        </div>
      </div>
    </PortalModal>
  );
}

/**
 * Modal oscuro para solicitar inscripción a una disciplina y categoría.
 */
export function PortalSolicitarInscripcionModal({
  disciplina,
  open,
  onClose,
  esSocio,
}: {
  disciplina: DisciplinaCatalogo | null;
  open: boolean;
  onClose: () => void;
  esSocio?: boolean;
}) {
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<number | null>(null);
  const selectId = useId();

  const {
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<SolicitarInscripcionFormValues>({
    resolver: zodResolver(solicitarInscripcionSchema),
    defaultValues: {
      disciplinaId: disciplina?.id ?? 0,
      categoriaDisciplinaId: undefined,
    },
  });

  const { solicitar, isPending } = useSolicitarInscripcion({
    onSuccess: () => {
      reset();
      setCategoriaSeleccionadaId(null);
      onClose();
    },
  });

  if (!disciplina) return null;

  const categorias = disciplina.categorias ?? [];
  const tieneCategorias = categorias.length > 0;
  const catActual: CategoriaCatalogo | undefined = categorias.find(
    (c) => c.id === categoriaSeleccionadaId,
  );

  const arancelMostrado = catActual ? catActual.arancelMensual : disciplina.arancelMensual;
  const docsObligatorios = catActual
    ? catActual.documentosObligatorios
    : disciplina.documentosObligatorios;
  const cumpleRestricciones = tieneCategorias
    ? (catActual?.cumpleRestricciones ?? false)
    : disciplina.cumpleRestricciones;
  const motivosIncumplimiento = tieneCategorias
    ? (catActual?.motivosIncumplimiento ?? [])
    : disciplina.motivosIncumplimiento;

  const handleCategoriaChange = (catId: number) => {
    setCategoriaSeleccionadaId(catId || null);
    setValue('categoriaDisciplinaId', catId || undefined, { shouldValidate: true });
  };

  const onSubmit = async () => {
    await solicitar({
      disciplinaId: disciplina.id,
      categoriaDisciplinaId: categoriaSeleccionadaId ?? undefined,
    });
  };

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      title={`Postulación · ${disciplina.nombre}`}
      description="Elegí tu categoría y revisá los requisitos antes de enviar la solicitud."
      size="md"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="form-solicitar-inscripcion"
      >
        {disciplina.descripcion && (
          <p className="text-xs leading-relaxed text-slate-400">{disciplina.descripcion}</p>
        )}

        {tieneCategorias && (
          <PortalFieldSelect
            id={selectId}
            data-testid="select-categoria-solicitud"
            label="Categoría *"
            value={categoriaSeleccionadaId ?? ''}
            onChange={(e) => handleCategoriaChange(Number(e.target.value))}
            options={[
              { value: '', label: 'Seleccioná una categoría…' },
              ...categorias.map((cat) => ({
                value: cat.id,
                label: `${cat.nombre}${cat.cumpleRestricciones ? '' : ' (No cumple requisitos)'}`,
              })),
            ]}
          />
        )}

        <div
          className="rounded-[2px] border border-slate-300/[0.12] bg-[#070b14] p-4"
          data-testid="arancel-mensual-info"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Arancel mensual
            </span>
            {disciplina.descuentoSocioPorcentaje > 0 && esSocio && (
              <PortalTag tone="info">
                {disciplina.descuentoSocioPorcentaje}% desc. socio aplicado
              </PortalTag>
            )}
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-white tabular-nums">
            ${arancelMostrado.toLocaleString('es-AR')}
            <span className="ml-1 text-xs font-normal text-slate-400">/ mes</span>
          </div>
        </div>

        <div className="space-y-2" data-testid="documentos-obligatorios-seccion">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <FileText size={14} className="text-blue-400" />
            <span>Documentación obligatoria</span>
          </div>
          {docsObligatorios.length === 0 ? (
            <p className="text-xs text-slate-400">No requiere documentación previa obligatoria.</p>
          ) : (
            <ul className="divide-y divide-slate-300/[0.08] rounded-[2px] border border-slate-300/[0.10] bg-[#070b14]">
              {docsObligatorios.map((doc) => (
                <li
                  key={doc.tipoDocumento}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-200">{doc.nombre}</span>
                  <span className="text-slate-400 tabular-nums">
                    {doc.plazoDiasTolerancia === 0
                      ? 'Requerido al inicio'
                      : `${doc.plazoDiasTolerancia} días de tolerancia`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {tieneCategorias && !categoriaSeleccionadaId ? (
          <div className="flex items-start gap-2 rounded-[2px] border border-slate-300/[0.12] bg-[#070b14] p-3 text-xs text-slate-300">
            <Info size={15} className="mt-0.5 shrink-0 text-blue-400" />
            <span>
              Seleccioná una categoría para validar los requisitos de edad y género de tu cuenta.
            </span>
          </div>
        ) : !cumpleRestricciones ? (
          <div
            className="flex items-start gap-2.5 rounded-[2px] border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
            data-testid="alerta-incumplimiento-restricciones"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">
                No cumplís las condiciones para esta categoría:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-rose-300">
                {motivosIncumplimiento.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-[2px] border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200"
            data-testid="alerta-cumple-restricciones"
          >
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>Tu perfil cumple con los requisitos de edad y género para inscribirte.</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5 border-t border-slate-300/[0.10] pt-4">
          <PortalButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isPending || isSubmitting}
          >
            Cancelar
          </PortalButton>
          <PortalButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={
              isPending ||
              isSubmitting ||
              (tieneCategorias && !categoriaSeleccionadaId) ||
              !cumpleRestricciones
            }
            data-testid="btn-confirmar-solicitud"
          >
            {isPending ? 'Enviando solicitud…' : 'Confirmar solicitud'}
          </PortalButton>
        </div>
      </form>
    </PortalModal>
  );
}

/**
 * Modal oscuro para confirmar la baja voluntaria como socio del club.
 */
export function PortalBajaSocioModal({
  open,
  onClose,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isPending?: boolean;
}) {
  return (
    <PortalModal
      open={open}
      onClose={isPending ? () => {} : onClose}
      title="Confirmar baja como socio"
      icon={<AlertTriangle size={16} />}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-[2px] border border-amber-400/25 bg-amber-500/10 p-3.5 text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold">¿Estás seguro de que querés darte de baja?</p>
            <p className="leading-relaxed text-amber-200/85">
              Al confirmar, tu membresía pasará a estado <strong>Inactivo</strong> y dejarás de
              tener beneficios exclusivos para socios activos.
            </p>
          </div>
        </div>

        <ul className="space-y-2 rounded-[2px] border border-slate-300/[0.10] bg-[#070b14] p-3 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            Tu usuario e historial de pagos y cuotas se conservan intactos.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            Podrás solicitar re-asociarte desde este mismo panel en cualquier momento.
          </li>
        </ul>

        <div className="flex justify-end gap-2.5 border-t border-slate-300/[0.10] pt-4">
          <PortalButton variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancelar
          </PortalButton>
          <PortalButton
            variant="danger"
            size="sm"
            onClick={() => void onConfirm()}
            disabled={isPending}
          >
            {isPending ? 'Procesando baja…' : 'Sí, confirmar baja'}
          </PortalButton>
        </div>
      </div>
    </PortalModal>
  );
}
