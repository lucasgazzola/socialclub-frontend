import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Check, CreditCard, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
import { CLUB } from '@/config/club';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClubPublico } from '@/features/club/hooks/useClubPublico';
import type { PlanSocio } from '@/features/club/types';
import { useMisCuotas } from '@/features/pagos/hooks/useMisCuotas';
import { useIniciarPagoCuotas } from '@/features/pagos/hooks/useIniciarPagoCuotas';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { SitioHeader } from '@/features/landing/components/SitioHeader';
import { recordarVolverA } from '@/lib/utils/volverA';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
import { HacermeSocioForm } from '../components/HacermeSocioForm';
import { useRegistrarmeSocio } from '../hooks/useRegistrarmeSocio';
import { useReactivarmeSocio } from '../hooks/useReactivarmeSocio';

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const PASOS = ['Plan', 'Cuenta', 'Datos', 'Primera cuota'] as const;

function nombrePeriodo(periodo: string) {
  const [anio, mes] = periodo.split('-').map(Number);
  const nombreMes = new Date(anio, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
  return `${nombreMes} de ${anio}`;
}

/**
 * TASK-60 · US-09 — Alta de socio desde la landing: elegir plan → crear cuenta
 * o ingresar → completar datos → pagar la primera cuota con Mercado Pago (o
 * dejarla para después). La membresía queda activa al confirmar los datos,
 * como en US-09; el pago lo acredita la pasarela (ADR 0003).
 */
export function AsociarmePage() {
  const { usuario, refrescar } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: club, isLoading: cargandoClub } = useClubPublico();
  const registrarme = useRegistrarmeSocio();
  const reactivarme = useReactivarmeSocio();
  const [recienAsociado, setRecienAsociado] = useState(false);

  const membresias = usuario?.persona?.membresias ?? [];
  const activa = membresias.find((m) => m.activo);
  const exSocio = membresias.length > 0 && !activa;
  const planId = Number(params.get('plan')) || null;
  const plan = club?.planes.find((p) => p.categoriaId === planId) ?? null;

  const elegirPlan = (id: number) => {
    setParams({ plan: String(id) }, { replace: true });
  };

  const pasoActual = recienAsociado || activa ? 3 : !plan ? 0 : !usuario ? 1 : 2;

  const alConfirmarDatos = async (datos: { dni: string; categoriaId: number }) => {
    await registrarme.mutateAsync(datos);
    // Re-firma el JWT con el rol SOCIO y refresca el perfil (igual que US-09).
    await authApi.refresh();
    await refrescar();
    setRecienAsociado(true);
    toast.success(`¡Bienvenido a ${CLUB.nombreCorto}! Ya sos socio.`);
  };

  const alReactivar = async () => {
    await reactivarme.mutateAsync();
    setRecienAsociado(true);
  };

  const irAIngresar = (destino: string) => {
    recordarVolverA(`${ROUTES.hacermeSocio}?plan=${planId}`);
    navigate(destino, { state: { from: `${ROUTES.hacermeSocio}?plan=${planId}` } });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SitioHeader variante="claro" conSecciones={false} />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">Hacete socio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Sumate a {CLUB.nombreCorto}
          </h1>
        </header>

        <Pasos actual={pasoActual} />

        {activa && !recienAsociado ? (
          <TarjetaYaSocio />
        ) : pasoActual === 3 ? (
          <PasoPrimeraCuota />
        ) : (
          <div className="space-y-6">
            {/* Paso 1: plan */}
            <section aria-labelledby="titulo-plan" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 id="titulo-plan" className="text-lg font-semibold text-slate-900">1. Elegí tu plan</h2>
              {cargandoClub ? (
                <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
              ) : (
                <div role="radiogroup" aria-label="Plan de socio" className="mt-5 grid gap-3 sm:grid-cols-2">
                  {club?.planes.map((p) => (
                    <OpcionPlan key={p.categoriaId} plan={p} elegido={p.categoriaId === planId} onElegir={elegirPlan} />
                  ))}
                </div>
              )}
            </section>

            {/* Paso 2: cuenta */}
            {plan && !usuario && (
              <section aria-labelledby="titulo-cuenta" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 id="titulo-cuenta" className="text-lg font-semibold text-slate-900">2. Tu cuenta</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Para asociarte necesitás una cuenta. Si la creás ahora, te mandamos un email para verificarla y
                  después volvés acá a terminar.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => irAIngresar(ROUTES.register)}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <UserPlus size={17} aria-hidden /> Crear mi cuenta
                  </button>
                  <button
                    type="button"
                    onClick={() => irAIngresar(ROUTES.login)}
                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <LogIn size={17} aria-hidden /> Ya tengo cuenta
                  </button>
                </div>
              </section>
            )}

            {/* Paso 3: datos */}
            {plan && usuario && (
              <section aria-labelledby="titulo-datos" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 id="titulo-datos" className="text-lg font-semibold text-slate-900">
                  {exSocio ? '2. Reactivá tu membresía' : '2. Confirmá tus datos'}
                </h2>
                {exSocio ? (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-slate-600">
                      Ya fuiste socio del club. Reactivá tu membresía y recuperá tus beneficios sin cargar todo de nuevo.
                    </p>
                    <button
                      type="button"
                      onClick={() => void alReactivar()}
                      disabled={reactivarme.isPending}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      {reactivarme.isPending ? 'Reactivando…' : 'Reactivar mi membresía'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5">
                    <HacermeSocioForm
                      key={plan.categoriaId}
                      defaultValues={{
                        nombre: usuario.nombre ?? '',
                        apellido: usuario.apellido ?? '',
                        email: usuario.email,
                        dni: usuario.persona?.dni ?? '',
                        categoriaId: plan.categoriaId,
                      }}
                      onSubmit={alConfirmarDatos}
                      submitLabel="Confirmar y asociarme"
                    />
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Pasos({ actual }: { actual: number }) {
  return (
    <ol className="mx-auto my-8 flex max-w-xl items-center justify-between gap-2" aria-label="Pasos para asociarte">
      {PASOS.map((paso, i) => {
        const hecho = i < actual;
        const enCurso = i === actual;
        return (
          <li key={paso} className="flex flex-1 items-center gap-2" aria-current={enCurso ? 'step' : undefined}>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                hecho && 'bg-emerald-500 text-white',
                enCurso && 'bg-brand-600 text-white ring-4 ring-brand-100',
                !hecho && !enCurso && 'bg-slate-200 text-slate-500',
              )}
            >
              {hecho ? <Check size={15} aria-hidden /> : i + 1}
            </span>
            <span className={cn('hidden text-xs font-semibold sm:inline', enCurso ? 'text-slate-900' : 'text-slate-500')}>
              {paso}
            </span>
            {i < PASOS.length - 1 && <span className="h-px flex-1 bg-slate-200" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function OpcionPlan({ plan, elegido, onElegir }: { plan: PlanSocio; elegido: boolean; onElegir: (id: number) => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegido}
      onClick={() => onElegir(plan.categoriaId)}
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-colors',
        elegido ? 'border-brand-600 bg-brand-50/60' : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <span>
        <span className="block font-semibold text-slate-900">{plan.nombre}</span>
        {plan.descripcion && <span className="block text-xs text-slate-500">{plan.descripcion}</span>}
        <span className="mt-2 block text-lg font-semibold text-slate-900">
          {plan.cuotaMensual != null ? `${moneda.format(plan.cuotaMensual)} / mes` : 'Cuota a confirmar'}
        </span>
      </span>
      <span
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          elegido ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
        )}
        aria-hidden
      >
        {elegido && <Check size={12} />}
      </span>
    </button>
  );
}

function TarjetaYaSocio() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center">
      <BadgeCheck size={40} className="mx-auto text-emerald-500" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold text-slate-900">Ya sos socio del club</h2>
      <p className="mt-2 text-sm text-slate-500">Tu membresía está activa. Podés ver y pagar tus cuotas desde Mi club.</p>
      <Link
        to={ROUTES.misCuotas}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Ver mis cuotas <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  );
}

/** Último paso: la primera cuota pendiente, para pagarla ya o más tarde. */
function PasoPrimeraCuota() {
  const { data: resumen, isLoading } = useMisCuotas({ enabled: true });
  const iniciarPago = useIniciarPagoCuotas();
  const navigate = useNavigate();
  const primera = resumen?.cuotasPendientes[0];

  const pagar = async () => {
    if (!primera) return;
    try {
      const orden = await iniciarPago.mutateAsync([primera.periodo]);
      if (orden.urlPago) irAPagar(orden.urlPago);
      else navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(orden.referencia)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el pago. Intentá nuevamente.');
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center" aria-labelledby="titulo-cuota">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <BadgeCheck size={28} aria-hidden />
      </span>
      <h2 id="titulo-cuota" className="mt-4 text-xl font-semibold text-slate-900">¡Ya sos socio!</h2>
      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div>
      ) : primera ? (
        <>
          <p className="mt-2 text-sm text-slate-500">Para completar el alta, pagá tu primera cuota.</p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Cuota de {nombrePeriodo(primera.periodo)}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{moneda.format(primera.monto)}</p>
          </div>
          <button
            type="button"
            onClick={() => void pagar()}
            disabled={iniciarPago.isPending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <CreditCard size={17} aria-hidden />
            {iniciarPago.isPending ? 'Abriendo Mercado Pago…' : 'Pagar con Mercado Pago'}
          </button>
          <Link to={ROUTES.miClub} className="mt-3 inline-block text-sm font-medium text-slate-500 hover:text-slate-800">
            Pagar más tarde
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-500">No tenés cuotas pendientes. ¡Bienvenido!</p>
          <Link
            to={ROUTES.miClub}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Ir a Mi club <ArrowRight size={16} aria-hidden />
          </Link>
        </>
      )}
    </section>
  );
}
