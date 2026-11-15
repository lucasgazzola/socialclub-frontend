import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, ClubLogo } from '@/components/ui';
import { CLUB } from '@/config/club';
import { ROUTES } from '@/routes/paths';

/**
 * TASK-60 — Marco de las pantallas de acceso (ingresar y registrarse): la
 * marca del club sobre el fondo navy de la landing y un enlace para volver al sitio.
 */
export function MarcoAcceso({ subtitulo, children }: { subtitulo: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A1A4F] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 mx-auto h-80 w-[900px] max-w-none translate-y-1/2 rounded-[50%] bg-gradient-to-r from-brand-500 to-accent-500 opacity-60 blur-[90px]"
      />
      <Link
        to={ROUTES.inicio}
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} aria-hidden /> Volver al sitio
      </Link>
      <Card className="w-full max-w-sm p-8 shadow-2xl shadow-black/30">
        <div className="mb-6 flex flex-col items-center text-center">
          <ClubLogo size={52} />
          <h1 className="mt-3 text-xl font-semibold text-slate-900">{CLUB.nombreCorto}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}
