import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, MailWarning } from 'lucide-react';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { authApi } from '../api/auth.api';
import {
  elegirContrasenaSchema,
  type ElegirContrasenaFormValues,
} from '../schemas/register.schema';
import type { ConsultaVerificacion } from '../types';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'invalido'; mensaje: string }
  | { tipo: 'listo'; datos: ConsultaVerificacion }
  | { tipo: 'verificado'; mensaje: string };

const mensajeDe = (error: unknown, porDefecto: string) =>
  error instanceof Error ? error.message : porDefecto;

/**
 * DT-54 — Pantalla del enlace que llega por email. Si la cuenta la creó el
 * club, la persona elige acá su contraseña; si se registró sola, solo
 * confirma su email. En los dos casos el email queda verificado.
 */
export function VerificarEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ElegirContrasenaFormValues>({ resolver: zodResolver(elegirContrasenaSchema) });

  useEffect(() => {
    if (!token) {
      setEstado({ tipo: 'invalido', mensaje: 'El enlace no es válido' });
      return;
    }
    let vigente = true;
    authApi
      .consultarVerificacion(token)
      .then((datos) => vigente && setEstado({ tipo: 'listo', datos }))
      .catch(
        (error: unknown) =>
          vigente &&
          setEstado({ tipo: 'invalido', mensaje: mensajeDe(error, 'El enlace no es válido') }),
      );
    return () => {
      vigente = false;
    };
  }, [token]);

  async function verificar(valores?: ElegirContrasenaFormValues) {
    setErrorServidor(null);
    try {
      const { mensaje } = await authApi.verificarEmail({ token, ...valores });
      setEstado({ tipo: 'verificado', mensaje });
    } catch (error) {
      setErrorServidor(mensajeDe(error, 'No se pudo verificar el email'));
    }
  }

  const irAlLogin = (
    <Link
      to={ROUTES.login}
      className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
    >
      Ir a iniciar sesión
    </Link>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">SocialClub</h1>
          <p className="mt-1 text-sm text-slate-500">Verificación de email</p>
        </div>

        {estado.tipo === 'cargando' && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {estado.tipo === 'invalido' && (
          <div role="alert" className="text-center">
            <MailWarning className="mx-auto text-amber-600" size={32} aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-700">{estado.mensaje}</p>
            {irAlLogin}
          </div>
        )}

        {estado.tipo === 'verificado' && (
          <div role="status" className="text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={32} aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-700">{estado.mensaje}</p>
            {irAlLogin}
          </div>
        )}

        {estado.tipo === 'listo' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Hola, <span className="font-medium">{estado.datos.nombre}</span>.{' '}
              {estado.datos.requiereContrasena
                ? 'Elegí tu contraseña para activar tu cuenta.'
                : 'Confirmá tu email para poder iniciar sesión.'}
            </p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {estado.datos.email}
            </p>

            {estado.datos.requiereContrasena ? (
              <form className="space-y-4" onSubmit={handleSubmit(verificar)} noValidate>
                <Input
                  id="password"
                  type="password"
                  label="Contraseña"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  id="confirmarPassword"
                  type="password"
                  label="Repetí la contraseña"
                  autoComplete="new-password"
                  error={errors.confirmarPassword?.message}
                  {...register('confirmarPassword')}
                />
                <p className="text-xs text-slate-500">
                  Mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial.
                </p>
                {errorServidor && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorServidor}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Activar mi cuenta'}
                </Button>
              </form>
            ) : (
              <>
                {errorServidor && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorServidor}
                  </p>
                )}
                <Button className="w-full" onClick={() => void verificar()}>
                  Verificar mi email
                </Button>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
