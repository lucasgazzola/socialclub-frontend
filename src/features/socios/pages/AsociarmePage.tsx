import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Check, CreditCard, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB } from '@/config/club';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClubPublico } from '@/features/club/hooks/useClubPublico';
import type { PlanSocio } from '@/features/club/types';
import { useMisCuotas } from '@/features/pagos/hooks/useMisCuotas';
import { useIniciarPagoCuotas } from '@/features/pagos/hooks/useIniciarPagoCuotas';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { SitioHeader } from '@/features/landing/components/SitioHeader';
import {
  PortalButton,
  PortalFieldInput,
  PortalSpinner,
  PortalSurface,
} from '@/features/portal-socio/components/PortalUI';
import { formatearDni } from '@/lib/utils/dni';
import { recordarVolverA } from '@/lib/utils/volverA';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
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
 * o ingresar → confirmar datos → pagar la primera cuota con Mercado Pago (o
 * dejarla para después). La membresía queda activa al confirmar los datos,
 * como en US-09; el pago lo acredita la pasarela (ADR 0003). Usa el lenguaje
 * visual del portal de socios para que el paso de la landing a Mi club sea continuo.
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
  const pasoActual = recienAsociado || activa ? 3 : !plan ? 0 : !usuario ? 1 : 2;

  const alConfirmarDatos = async (dni: string) => {
    if (!plan) return;
    await registrarme.mutateAsync({ dni, categoriaId: plan.categoriaId });
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
    const volver = `${ROUTES.hacermeSocio}?plan=${planId}`;
    recordarVolverA(volver);
    navigate(destino, { state: { from: volver } });
  };

  return (
    <div className="portal-socio min-h-screen bg-[#03060c] text-slate-100">
      <SitioHeader conSecciones={false} />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Hacete socio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-white sm:text-4xl">
            Sumate a {CLUB.nombreCorto}
          </h1>
        </header>

        <Pasos actual={pasoActual} />

        {activa && !recienAsociado ? (
          <TarjetaYaSocio />
        ) : pasoActual === 3 ? (
          <PasoPrimeraCuota />
        ) : (
          <div className="space-y-5">
            <PortalSurface className="p-6 sm:p-7" aria-labelledby="titulo-plan" role="region">
              <h2 id="titulo-plan" className="text-base font-semibold text-white">
                1. Elegí tu plan
              </h2>
              {cargandoClub ? (
                <div className="flex justify-center py-8">
                  <PortalSpinner />
                </div>
              ) : (
                <div role="radiogroup" aria-label="Plan de socio" className="mt-5 grid gap-3 sm:grid-cols-2">
                  {club?.planes.map((p) => (
                    <OpcionPlan
                      key={p.categoriaId}
                      plan={p}
                      elegido={p.categoriaId === planId}
                      onElegir={(id) => setParams({ plan: String(id) }, { replace: true })}
                    />
                  ))}
                </div>
              )}
            </PortalSurface>

            {plan && !usuario && (
              <PortalSurface className="p-6 sm:p-7" aria-labelledby="titulo-cuenta" role="region">
                <h2 id="titulo-cuenta" className="text-base font-semibold text-white">
                  2. Tu cuenta
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Para asociarte necesitás una cuenta. Si la creás ahora, te mandamos un email para verificarla y
                  después volvés acá a terminar.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <PortalButton onClick={() => irAIngresar(ROUTES.register)}>
                    <UserPlus size={16} aria-hidden /> Crear mi cuenta
                  </PortalButton>
                  <PortalButton variant="secondary" onClick={() => irAIngresar(ROUTES.login)}>
                    <LogIn size={16} aria-hidden /> Ya tengo cuenta
                  </PortalButton>
                </div>
              </PortalSurface>
            )}

            {plan && usuario && (
              <PortalSurface className="p-6 sm:p-7" aria-labelledby="titulo-datos" role="region">
                <h2 id="titulo-datos" className="text-base font-semibold text-white">
                  {exSocio ? '2. Reactivá tu membresía' : '2. Confirmá tus datos'}
                </h2>
                {exSocio ? (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-slate-400">
                      Ya fuiste socio del club. Reactivá tu membresía y recuperá tus beneficios sin cargar todo de nuevo.
                    </p>
                    <PortalButton onClick={() => void alReactivar()} disabled={reactivarme.isPending}>
                      {reactivarme.isPending ? 'Reactivando…' : 'Reactivar mi membresía'}
                    </PortalButton>
                  </div>
                ) : (
                  <FormularioDatos
                    nombre={[usuario.nombre, usuario.apellido].filter(Boolean).join(' ')}
                    email={usuario.email}
                    dniActual={usuario.persona?.dni ?? null}
                    plan={plan}
                    onConfirmar={alConfirmarDatos}
                  />
                )}
              </PortalSurface>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/** Datos del alta: lo de la cuenta en solo lectura y el DNI si todavía no lo cargó. */
function FormularioDatos({
  nombre,
  email,
  dniActual,
  plan,
  onConfirmar,
}: {
  nombre: string;
  email: string;
  dniActual: string | null;
  plan: PlanSocio;
  onConfirmar: (dni: string) => Promise<void>;
}) {
  const [dni, setDni] = useState(dniActual ?? '');
  const [error, setError] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorServidor(null);
    const limpio = dni.replace(/\D/g, '');
    if (!/^\d{6,8}$/.test(limpio)) {
      setError('El DNI debe tener entre 6 y 8 dígitos, solo números.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar(limpio);
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : 'No se pudo completar el alta. Intentá nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="mt-5 space-y-4" onSubmit={(e) => void enviar(e)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <PortalFieldInput id="nombre" label="Nombre y apellido" value={nombre} readOnly />
        <PortalFieldInput id="email" label="Email" value={email} readOnly />
        {dniActual ? (
          <PortalFieldInput id="dni-readonly" label="DNI" value={formatearDni(dniActual)} readOnly />
        ) : (
          <PortalFieldInput
            id="dni"
            label="DNI"
            inputMode="numeric"
            placeholder="Ej: 12345678"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            error={error ?? undefined}
          />
        )}
        <PortalFieldInput
          id="plan"
          label="Plan"
          value={`${plan.nombre}${plan.cuotaMensual != null ? ` · ${moneda.format(plan.cuotaMensual)} / mes` : ''}`}
          readOnly
        />
      </div>
      {errorServidor && (
        <p role="alert" className="rounded-[2px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorServidor}
        </p>
      )}
      <PortalButton type="submit" disabled={enviando}>
        {enviando ? 'Registrando…' : 'Confirmar y asociarme'}
      </PortalButton>
    </form>
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
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border text-xs font-bold',
                hecho && 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
                enCurso && 'border-blue-400/60 bg-blue-600 text-white shadow-[0_0_20px_-6px_rgba(37,99,235,0.8)]',
                !hecho && !enCurso && 'border-white/[0.12] bg-[#070c16] text-slate-500',
              )}
            >
              {hecho ? <Check size={15} aria-hidden /> : i + 1}
            </span>
            <span className={cn('hidden text-xs font-semibold sm:inline', enCurso ? 'text-white' : 'text-slate-500')}>
              {paso}
            </span>
            {i < PASOS.length - 1 && <span className="h-px flex-1 bg-white/[0.10]" aria-hidden />}
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
        'flex items-start justify-between gap-3 rounded-[2px] border p-4 text-left transition-colors',
        elegido ? 'border-blue-500/70 bg-blue-500/[0.10]' : 'border-white/[0.10] bg-[#050912] hover:border-blue-400/40',
      )}
    >
      <span>
        <span className="block font-semibold text-white">{plan.nombre}</span>
        {plan.descripcion && <span className="block text-xs text-slate-400">{plan.descripcion}</span>}
        <span className="mt-2 block text-lg font-semibold text-white tabular-nums">
          {plan.cuotaMensual != null ? `${moneda.format(plan.cuotaMensual)} / mes` : 'Cuota a confirmar'}
        </span>
      </span>
      <span
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          elegido ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-600',
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
    <PortalSurface className="mx-auto max-w-lg p-8 text-center">
      <BadgeCheck size={40} className="mx-auto text-emerald-400" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold text-white">Ya sos socio del club</h2>
      <p className="mt-2 text-sm text-slate-400">Tu membresía está activa. Podés ver y pagar tus cuotas desde Mi club.</p>
      <Link
        to={ROUTES.misCuotas}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-[2px] border border-blue-400/45 bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-500"
      >
        Ver mis cuotas <ArrowRight size={16} aria-hidden />
      </Link>
    </PortalSurface>
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
    <PortalSurface variant="pass" className="mx-auto max-w-lg p-8 text-center" aria-labelledby="titulo-cuota" role="region">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[2px] border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
        <BadgeCheck size={28} aria-hidden />
      </span>
      <h2 id="titulo-cuota" className="mt-4 text-xl font-semibold text-white">
        ¡Ya sos socio!
      </h2>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <PortalSpinner />
        </div>
      ) : primera ? (
        <>
          <p className="mt-2 text-sm text-slate-400">Para completar el alta, pagá tu primera cuota.</p>
          <div className="mt-6 rounded-[2px] border border-white/[0.08] bg-[#050912] p-5">
            <p className="text-sm text-slate-400">Cuota de {nombrePeriodo(primera.periodo)}</p>
            <p className="mt-1 text-3xl font-semibold text-white tabular-nums">{moneda.format(primera.monto)}</p>
          </div>
          <PortalButton className="mt-6 w-full" onClick={() => void pagar()} disabled={iniciarPago.isPending}>
            <CreditCard size={16} aria-hidden />
            {iniciarPago.isPending ? 'Abriendo Mercado Pago…' : 'Pagar con Mercado Pago'}
          </PortalButton>
          <Link to={ROUTES.miClub} className="mt-3 inline-block text-sm font-medium text-slate-400 hover:text-white">
            Pagar más tarde
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-400">No tenés cuotas pendientes. ¡Bienvenido!</p>
          <Link
            to={ROUTES.miClub}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-[2px] border border-blue-400/45 bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Ir a Mi club <ArrowRight size={16} aria-hidden />
          </Link>
        </>
      )}
    </PortalSurface>
  );
}
