import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  Dumbbell,
  Goal,
  HeartHandshake,
  MapPin,
  Medal,
  QrCode,
  Ticket,
  Trophy,
  Volleyball,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CLUB } from '@/config/club';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClubPublico } from '@/features/club/hooks/useClubPublico';
import type { DisciplinaPublica, PlanSocio } from '@/features/club/types';
import { useEventos } from '@/features/eventos/hooks/useEventos';
import type { Evento } from '@/features/eventos/types';
import { QRCode } from '@/features/entradas/components/QRCode';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
import { SitioHeader } from '../components/SitioHeader';
import { SitioFooter } from '../components/SitioFooter';

const NAVY = 'bg-[#0A1A4F]';
const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * TASK-60 — Landing pública del club (la raíz del sitio). Presenta al club, sus
 * disciplinas, eventos y planes de socio, y la app de autogestión. Estética
 * inspirada en global.fan (hero oscuro, arco de luz, botones píldora) con la
 * paleta de SocialClub: azul navy de marca y acento naranja.
 */
export function LandingPage() {
  const { data: club } = useClubPublico();

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <SitioHeader />
      <main>
        <Hero numeros={club?.numeros} />
        <SeccionClub />
        <SeccionDisciplinas disciplinas={club?.disciplinas} />
        <SeccionEventos />
        <SeccionPlanes planes={club?.planes} />
        <SeccionApp />
        <LlamadoFinal />
      </main>
      <SitioFooter />
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────── */

function Hero({ numeros }: { numeros?: { socios: number; participantes: number; disciplinas: number; eventosProximos: number } }) {
  const { usuario } = useAuth();
  const datos = numeros
    ? [
        { valor: numeros.socios, label: 'socios' },
        { valor: numeros.participantes, label: 'deportistas' },
        { valor: numeros.disciplinas, label: 'disciplinas' },
        { valor: numeros.eventosProximos, label: 'eventos por venir' },
      ]
    : null;

  return (
    <section className={cn('relative isolate overflow-hidden pb-16 pt-32 text-white sm:pb-24 sm:pt-40', NAVY)}>
      {/* Arco de luz azul → naranja */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center">
        <div className="h-[560px] w-[1500px] max-w-none translate-y-[58%] rounded-[50%] bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500 blur-[50px] motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center">
        <div className="h-[540px] w-[1380px] max-w-none translate-y-[64%] rounded-[50%] bg-[#0A1A4F] blur-[28px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden />
          {CLUB.nombre} · {CLUB.localidad}
        </p>
        <h1 className="mt-6 text-4xl font-light leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">
          Viví el club.
          <br />
          <span className="font-semibold">Desde tu celular.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
          Hacete socio y pagá la cuota online, comprá entradas con QR, inscribite a una disciplina y
          reservá espacios. Todo en un solo lugar.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to={usuario ? ROUTES.miClub : ROUTES.hacermeSocio}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-[#0A1A4F] shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 sm:w-auto"
          >
            {usuario ? 'Ir a Mi club' : 'Quiero ser socio'} <ArrowRight size={18} aria-hidden />
          </Link>
          {!usuario && (
            <Link
              to={ROUTES.login}
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:w-auto"
            >
              Ya soy socio, ingresar
            </Link>
          )}
        </div>
      </div>

      {datos && (
        <dl className="relative mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 px-4 sm:mt-20 sm:grid-cols-4 sm:px-6">
          {datos.map((d) => (
            <div key={d.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-md">
              <dd className="text-3xl font-semibold tabular-nums sm:text-4xl">{d.valor}</dd>
              <dt className="mt-1 text-xs font-medium uppercase tracking-wider text-brand-100/80">{d.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/* ─── El club ───────────────────────────────────────────────────────────── */

function SeccionClub() {
  return (
    <section id="club" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <EtiquetaSeccion>El club</EtiquetaSeccion>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Un club de la comunidad de Ordóñez
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{CLUB.mision}</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Valores del club">
            {CLUB.valores.map((v) => (
              <li key={v} className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-700">
                {v}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-[#0A1A4F] p-8 text-white shadow-xl shadow-brand-900/20 sm:p-10">
          <div aria-hidden className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-accent-500/40 blur-3xl" />
          <HeartHandshake size={34} className="relative text-accent-300" aria-hidden />
          <p className="relative mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-100">Nuestra visión</p>
          <p className="relative mt-3 text-xl font-light leading-relaxed sm:text-2xl">“{CLUB.vision}”</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Disciplinas ───────────────────────────────────────────────────────── */

function iconoDisciplina(nombre: string): LucideIcon {
  const n = nombre.toLowerCase();
  if (n.includes('fútbol') || n.includes('futbol')) return Goal;
  if (n.includes('nata') || n.includes('pileta')) return Waves;
  if (n.includes('vóley') || n.includes('voley') || n.includes('básquet') || n.includes('basquet')) return Volleyball;
  if (n.includes('hockey') || n.includes('tenis')) return Trophy;
  if (n.includes('atlet') || n.includes('running')) return Activity;
  if (n.includes('patín') || n.includes('patin') || n.includes('gimnasia')) return Medal;
  return Dumbbell;
}

function rangoEdad(d: DisciplinaPublica): string | null {
  if (d.edadMinima != null && d.edadMaxima != null) return `De ${d.edadMinima} a ${d.edadMaxima} años`;
  if (d.edadMinima != null) return `Desde ${d.edadMinima} años`;
  if (d.edadMaxima != null) return `Hasta ${d.edadMaxima} años`;
  return null;
}

function SeccionDisciplinas({ disciplinas }: { disciplinas?: DisciplinaPublica[] }) {
  return (
    <section id="disciplinas" className="scroll-mt-16 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EncabezadoSeccion
          etiqueta="Disciplinas"
          titulo="Elegí tu deporte"
          bajada="Inscribite online a la disciplina y categoría que quieras. La subcomisión revisa tu solicitud y te avisa."
        />
        {!disciplinas ? (
          <GrillaCargando />
        ) : disciplinas.length === 0 ? (
          <p className="mt-10 text-center text-slate-500">Pronto vas a ver acá las disciplinas del club.</p>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {disciplinas.map((d) => {
              const Icono = iconoDisciplina(d.nombre);
              const edad = rangoEdad(d);
              return (
                <li key={d.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icono size={22} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{d.nombre}</h3>
                  {d.descripcion && <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{d.descripcion}</p>}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {edad && (
                      <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-800">{edad}</span>
                    )}
                    {d.categorias.slice(0, 3).map((c) => (
                      <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{c}</span>
                    ))}
                    {d.categorias.length > 3 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        +{d.categorias.length - 3}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-10 text-center">
          <Link
            to={ROUTES.solicitarInscripcion}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0A1A4F] px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Inscribirme a una disciplina <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Eventos ───────────────────────────────────────────────────────────── */

function SeccionEventos() {
  const { data, isLoading } = useEventos({ ordenar: 'fecha', fechaDesde: hoyIso(), pagina: 1, porPagina: 3 });
  const eventos = (data?.items ?? []).filter((e) => e.estado === 'PUBLICADO');

  return (
    <section id="eventos" className={cn('relative isolate scroll-mt-16 overflow-hidden py-20 text-white sm:py-28', NAVY)}>
      <div aria-hidden className="pointer-events-none absolute -left-40 top-0 -z-10 h-96 w-96 rounded-full bg-brand-500/30 blur-[100px]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EncabezadoSeccion
          oscuro
          etiqueta="Eventos"
          titulo="Lo que viene en el club"
          bajada="Comprá tu entrada online y entrá con el QR desde el celular. Los socios tienen descuento."
        />
        {isLoading ? (
          <GrillaCargando oscuro />
        ) : eventos.length === 0 ? (
          <p className="mt-10 text-center text-slate-300">No hay eventos publicados por ahora. ¡Volvé pronto!</p>
        ) : (
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {eventos.map((e) => (
              <TarjetaEvento key={e.id} evento={e} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TarjetaEvento({ evento }: { evento: Evento }) {
  const fecha = new Date(evento.fechaEvento);
  const precio = Number(evento.precio ?? 0);
  return (
    <li className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.1]">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-white py-2 text-[#0A1A4F]">
          <span className="text-[11px] font-bold uppercase">{fecha.toLocaleDateString('es-AR', { month: 'short' })}</span>
          <span className="text-2xl font-bold leading-none">{fecha.getDate()}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug">{evento.nombre}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
            <CalendarDays size={14} aria-hidden />
            {fecha.toLocaleString('es-AR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-300">
            <MapPin size={14} aria-hidden /> {evento.lugarAcreditacion}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-xl font-semibold">{precio > 0 ? moneda.format(precio) : 'Gratis'}</p>
          {precio > 0 && evento.descuentoSocio > 0 && (
            <p className="text-xs font-medium text-accent-300">{evento.descuentoSocio}% off para socios</p>
          )}
        </div>
        {evento.requiereEntrada && (
          <Link
            to={ROUTES.comprarEntradas(evento.id)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-[#0A1A4F] transition-transform hover:-translate-y-0.5"
          >
            <Ticket size={15} aria-hidden /> Entradas
          </Link>
        )}
      </div>
    </li>
  );
}

/* ─── Planes ────────────────────────────────────────────────────────────── */

const BENEFICIOS = [
  'Credencial digital en tu celular',
  'Descuentos de socio en entradas y alquiler de espacios',
  'Pagá la cuota online con Mercado Pago',
];

function SeccionPlanes({ planes }: { planes?: PlanSocio[] }) {
  return (
    <section id="planes" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EncabezadoSeccion
          etiqueta="Hacete socio"
          titulo="Elegí tu plan"
          bajada="Asociate en minutos: elegís la categoría, completás tus datos y pagás la primera cuota online."
        />
        {!planes ? (
          <GrillaCargando />
        ) : (
          <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planes.map((plan) => (
              <li
                key={plan.categoriaId}
                className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10"
              >
                <h3 className="text-lg font-semibold">{plan.nombre}</h3>
                {plan.descripcion && <p className="mt-1 text-sm text-slate-500">{plan.descripcion}</p>}
                <p className="mt-6">
                  {plan.cuotaMensual != null ? (
                    <>
                      <span className="text-4xl font-semibold tracking-tight">{moneda.format(plan.cuotaMensual)}</span>
                      <span className="ml-1 text-sm text-slate-500">/ mes</span>
                    </>
                  ) : (
                    <span className="text-base font-medium text-slate-500">Consultá la cuota en secretaría</span>
                  )}
                </p>
                <ul className="mb-8 mt-6 space-y-2.5 text-sm text-slate-700">
                  {BENEFICIOS.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`${ROUTES.hacermeSocio}?plan=${plan.categoriaId}`}
                  className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-[#0A1A4F] text-sm font-semibold text-white transition-colors group-hover:bg-brand-600"
                >
                  Elegir este plan
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─── La app ────────────────────────────────────────────────────────────── */

const FUNCIONES = [
  { icon: QrCode, titulo: 'Entradas con QR', detalle: 'Comprás online y mostrás el QR en la puerta.' },
  { icon: CreditCard, titulo: 'Cuotas al día', detalle: 'Ves lo que debés y pagás con Mercado Pago.' },
  { icon: Dumbbell, titulo: 'Inscripciones', detalle: 'Te postulás a una disciplina y seguís el trámite.' },
  { icon: CalendarDays, titulo: 'Reservas', detalle: 'Pedís un espacio del club y pagás la seña.' },
];

function SeccionApp() {
  return (
    <section className="overflow-hidden bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <EtiquetaSeccion>Mi club</EtiquetaSeccion>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tu club, en el bolsillo</h2>
          <p className="mt-4 text-lg text-slate-600">
            Socios y deportistas se autogestionan desde Mi club, sin filas ni papeles.
          </p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {FUNCIONES.map(({ icon: Icono, titulo, detalle }) => (
              <li key={titulo} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
                  <Icono size={19} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-sm text-slate-600">{detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <MockupTelefono />
      </div>
    </section>
  );
}

/** Vista ilustrativa de Mi club (datos de muestra, no reales). */
function MockupTelefono() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]" aria-hidden>
      <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-brand-400/40 to-accent-400/40 blur-3xl" />
      <div className="rounded-[2.6rem] border-[10px] border-slate-900 bg-slate-50 shadow-2xl shadow-slate-900/30">
        <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-slate-900" />
        <div className="space-y-3 p-4 pb-6">
          <div className="rounded-2xl bg-[#0A1A4F] p-4 text-white">
            <p className="text-[10px] text-brand-200">{CLUB.nombreCorto}</p>
            <p className="text-lg font-bold">Hola, Lucía</p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              Socia activa
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tu próxima entrada</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-lg ring-1 ring-slate-200">
                <QRCode value="MUESTRA-MI-CLUB" size={64} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Peña aniversario</p>
                <p className="text-[11px] text-slate-500">sáb 21:00 · Salón</p>
                <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Válida</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white p-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Cuota de noviembre</p>
              <p className="text-[11px] text-slate-500">Vence el día 10</p>
            </div>
            <span className="rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold text-white">Pagar</span>
          </div>
          <div className="grid grid-cols-4 gap-1 pt-1 text-center text-[9px] font-semibold text-slate-500">
            {['Inicio', 'Entradas', 'Cuotas', 'Reservas'].map((t, i) => (
              <span key={t} className={i === 0 ? 'text-brand-700' : ''}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Llamado final ─────────────────────────────────────────────────────── */

function LlamadoFinal() {
  const { usuario } = useAuth();
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className={cn('relative isolate mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white sm:px-12', NAVY)}>
        <div aria-hidden className="absolute inset-x-0 -bottom-40 -z-10 mx-auto h-72 w-[720px] max-w-none rounded-[50%] bg-gradient-to-r from-brand-500 to-accent-500 opacity-60 blur-[80px]" />
        <h2 className="text-3xl font-light tracking-tight sm:text-5xl">
          ¿Querés ser parte de <span className="font-semibold">{CLUB.nombreCorto}</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">Asociate hoy y empezá a disfrutar de todos los beneficios del club.</p>
        <Link
          to={usuario ? ROUTES.miClub : ROUTES.hacermeSocio}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 font-semibold text-[#0A1A4F] transition-transform hover:-translate-y-0.5"
        >
          {usuario ? 'Ir a Mi club' : 'Quiero ser socio'} <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

/* ─── Piezas comunes ────────────────────────────────────────────────────── */

function EtiquetaSeccion({ children, oscuro = false }: { children: React.ReactNode; oscuro?: boolean }) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', oscuro ? 'text-accent-300' : 'text-accent-600')}>
      {children}
    </p>
  );
}

function EncabezadoSeccion({ etiqueta, titulo, bajada, oscuro = false }: { etiqueta: string; titulo: string; bajada: string; oscuro?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <EtiquetaSeccion oscuro={oscuro}>{etiqueta}</EtiquetaSeccion>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{titulo}</h2>
      <p className={cn('mt-4 text-lg', oscuro ? 'text-slate-300' : 'text-slate-600')}>{bajada}</p>
    </div>
  );
}

function GrillaCargando({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn('h-44 animate-pulse rounded-2xl', oscuro ? 'bg-white/10' : 'bg-slate-200/60')} />
      ))}
    </div>
  );
}
