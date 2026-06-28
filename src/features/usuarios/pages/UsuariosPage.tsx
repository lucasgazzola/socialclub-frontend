import { Card } from '@/components/ui';

/**
 * Placeholder de la sección de Usuarios administrativos (US-01 a US-03).
 *
 * Se deja intencionalmente como punto de partida: el equipo debe construir esta
 * feature replicando el patrón de `features/socios/` (api → hooks → components →
 * page). La ruta ya está protegida solo para el rol ADMIN.
 */
export function UsuariosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios administrativos</h1>
        <p className="mt-1 text-sm text-slate-500">Gestión de usuarios y roles del sistema.</p>
      </header>

      <Card className="border-dashed p-8 text-center text-slate-500">
        <p className="font-medium text-slate-700">Sección pendiente de implementación</p>
        <p className="mt-1 text-sm">
          Historias US-01 a US-03. Replicá el patrón de <code>features/socios/</code> para
          construir el ABM de usuarios.
        </p>
      </Card>
    </div>
  );
}
