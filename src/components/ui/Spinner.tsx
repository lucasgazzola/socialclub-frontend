import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Indicador de carga reutilizable. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-slate-400', className)} aria-hidden />;
}

/** Pantalla completa de carga, útil para estados de verificación de sesión. */
export function FullScreenLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
