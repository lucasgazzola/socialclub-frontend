import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  CreditCard,
  Dumbbell,
  FileText,
  Maximize2,
  Ticket,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMisCuotas } from '@/features/pagos/hooks/useMisCuotas';
import { useMisEntradas } from '@/features/entradas/hooks/useEntradas';
import { useMisReservas } from '@/features/reservas/hooks/useReservas';
import { useMisSolicitudesInscripcion } from '@/features/inscripcion/hooks/useSolicitarInscripcion';
import { QRCode } from '@/features/entradas/components/QRCode';
import { QrPantallaCompleta } from '@/features/entradas/components/QrPantallaCompleta';
import { formatearFechaHora } from '@/features/entradas/utils/estadoEntrada';
import { formatearDni } from '@/lib/utils/dni';
import { CLUB } from '@/config/club';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function formatearFecha(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

interface Pendiente {
  id: string;
  icon: LucideIcon;
  titulo: string;
  detalle: string;
  accion: string;
  to: string;
  tono: 'urgente' | 'aviso' | 'info';
}

/**
 * TASK-60 — Inicio de Mi club. Responde primero «qué tengo que hacer»
 * (cuotas, seña de reservas, solicitudes) y después muestra la próxima
 * entrada y los accesos a cada sección. Sirve igual para socios y para
 * participantes o usuarios sin membresía (a ellos les ofrece asociarse).
 */
export function MiClubInicioPage() {
  const { usuario } = useAuth();
  const persona = usuario?.persona;
  const membresias = persona?.membresias ?? [];
  const membresiaActiva = membresias.find((m) => m.activo);
  const esOFueSocio = membresias.length > 0;

  const cuotas = useMisCuotas({ enabled: esOFueSocio });
  const proxima = useMisEntradas({ vigencia: 'PROXIMAS', page: 1, limit: 1 });
  const reservas = useMisReservas();
  const solicitudes = useMisSolicitudesInscripcion();
  const [mostrarQr, setMostrarQr] = useState(false);

  const pendientes: Pendiente[] = [];
  const resumen = cuotas.data;
  if (resumen && resumen.cuotasPendientes.length > 0) {
    const moroso = resumen.estadoFinanciero === 'MOROSO';
    pendientes.push({
      id: 'cuotas',
      icon: CreditCard,
      titulo: moroso ? 'Tenés cuotas vencidas' : 'Tenés cuotas para pagar',
      detalle: `${resumen.cuotasPendientes.length} ${resumen.cuotasPendientes.length === 1 ? 'cuota' : 'cuotas'} · ${moneda.format(resumen.totalAdeudado)}`,
      accion: 'Pagar',
      to: ROUTES.misCuotas,
      tono: moroso ? 'urgente' : 'aviso',
    });
  }
  for (const reserva of reservas.data ?? []) {
    if (reserva.puedePagarSena) {
      pendientes.push({
        id: `sena-${reserva.id}`,
        icon: CalendarClock,
        titulo: `Pagá la seña de tu reserva ${reserva.codigo}`,
        detalle: `${reserva.espacio.nombre} · ${moneda.format(reserva.montoSena)}${reserva.limitePagoSenaTexto ? ` · hasta ${reserva.limitePagoSenaTexto}` : ''}`,
        accion: 'Pagar seña',
        to: ROUTES.misReservas,
        tono: 'aviso',
      });
    }
  }
  const enEvaluacion = (solicitudes.data ?? []).filter(
    (s) => s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_DOCUMENTACION',
  );
  if (enEvaluacion.length > 0) {
    const faltaDoc = enEvaluacion.some((s) => s.estado === 'PENDIENTE_DOCUMENTACION');
    pendientes.push({
      id: 'solicitudes',
      icon: Dumbbell,
      titulo: faltaDoc ? 'Una solicitud espera tu documentación' : 'Tenés solicitudes de inscripción en evaluación',
      detalle: enEvaluacion.map((s) => s.disciplina.nombre).join(', '),
      accion: 'Ver',
      to: ROUTES.misSolicitudesInscripcion,
      tono: faltaDoc ? 'aviso' : 'info',
    });
  }

  const entradaProxima = proxima.data?.items[0];
  const nombre = usuario?.nombre ?? persona?.nombre ?? '';

  return (
    <div className="space-y-8">
      {/* Saludo + credencial */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0A1A4F] p-6 text-white shadow-lg shadow-brand-950/20 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-brand-500/50 to-accent-500/40 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-200">{CLUB.nombre}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Hola{nombre ? `, ${nombre}` : ''}</h1>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              {membresiaActiva
                ? 'Todo lo tuyo en el club, en un solo lugar.'
                : 'Comprá entradas, inscribite a disciplinas y reservá espacios desde acá.'}
            </p>
          </div>

          {membresiaActiva ? (
            <div
              data-testid="credencial-socio"
              className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-200">
                  Credencial de socio
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-300/30">
                  <BadgeCheck size={12} aria-hidden /> Activa
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold">
                {[usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ')}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-400">Categoría</dt>
                  <dd className="font-semibold">{membresiaActiva.categoria?.nombre ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">DNI</dt>
                  <dd className="font-semibold">{persona?.dni ? formatearDni(persona.dni) : '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Socio desde</dt>
                  <dd className="font-semibold">{formatearFecha(membresiaActiva.fechaAlta)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <Link
              to={ROUTES.hacermeSocio}
              className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-[#0A1A4F] shadow-sm transition-transform hover:-translate-y-0.5 md:self-auto"
            >
              <UserPlus size={16} aria-hidden />
              {esOFueSocio ? 'Volver a ser socio' : 'Hacete socio'}
            </Link>
          )}
        </div>
      </section>

      {/* Para hacer */}
      <section aria-labelledby="titulo-pendientes" className="space-y-3">
        <h2 id="titulo-pendientes" className="text-base font-semibold text-slate-900">
          Para hacer
        </h2>
        {pendientes.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {pendientes.map((p) => (
              <li key={p.id}>
                <Link
                  to={p.to}
                  className={cn(
                    'group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-shadow hover:shadow-md',
                    p.tono === 'urgente' && 'border-rose-200',
                    p.tono === 'aviso' && 'border-amber-200',
                    p.tono === 'info' && 'border-slate-200',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      p.tono === 'urgente' && 'bg-rose-50 text-rose-600',
                      p.tono === 'aviso' && 'bg-amber-50 text-amber-700',
                      p.tono === 'info' && 'bg-brand-50 text-brand-600',
                    )}
                  >
                    <p.icon size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{p.titulo}</span>
                    <span className="block truncate text-xs text-slate-500">{p.detalle}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    {p.accion}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-800">
            <BadgeCheck size={17} aria-hidden /> Estás al día. No tenés nada pendiente.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Próxima entrada */}
        <section aria-labelledby="titulo-proxima" className="min-w-0 space-y-3 lg:col-span-2">
          <h2 id="titulo-proxima" className="text-base font-semibold text-slate-900">
            Tu próxima entrada
          </h2>
          {entradaProxima ? (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="rounded-xl bg-white p-1.5 ring-1 ring-slate-200">
                <QRCode value={entradaProxima.token} size={88} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {entradaProxima.evento?.nombre ?? 'Evento'}
                </p>
                <p className="mt-0.5 text-xs capitalize text-slate-500">
                  {formatearFechaHora(entradaProxima.evento?.fechaEvento)}
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarQr(true)}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  <Maximize2 size={13} aria-hidden /> Mostrar en la puerta
                </button>
              </div>
            </div>
          ) : (
            <Link
              to={ROUTES.eventos}
              className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 hover:border-brand-300 hover:text-brand-700"
            >
              No tenés entradas para próximos eventos.
              <span className="font-semibold text-brand-700">Ver eventos</span>
            </Link>
          )}
        </section>

        {/* Accesos */}
        <section aria-labelledby="titulo-accesos" className="min-w-0 space-y-3 lg:col-span-3">
          <h2 id="titulo-accesos" className="text-base font-semibold text-slate-900">
            ¿Qué querés hacer?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Acceso to={ROUTES.eventos} icon={Ticket} titulo="Comprar entradas" detalle="Eventos del club" />
            <Acceso
              to={ROUTES.solicitarInscripcion}
              icon={Dumbbell}
              titulo="Inscribirme"
              detalle="A una disciplina"
            />
            <Acceso
              to={ROUTES.solicitarReserva}
              icon={CalendarPlus}
              titulo="Reservar"
              detalle="Un espacio del club"
            />
            <Acceso
              to={ROUTES.miDocumentacion}
              icon={FileText}
              titulo="Mi documentación"
              detalle="Estado y vencimientos"
            />
          </div>
        </section>
      </div>

      {mostrarQr && entradaProxima && (
        <QrPantallaCompleta entradas={[entradaProxima]} onCerrar={() => setMostrarQr(false)} />
      )}
    </div>
  );
}

function Acceso({ to, icon: Icon, titulo, detalle }: { to: string; icon: LucideIcon; titulo: string; detalle: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon size={19} aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{titulo}</span>
        <span className="block text-xs text-slate-500">{detalle}</span>
      </span>
    </Link>
  );
}
