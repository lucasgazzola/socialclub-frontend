import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DocumentacionParticipante } from '../components/DocumentacionParticipante';

/**
 * DT-28: El participante puede consultar su propia documentación.
 * Accesible para cualquier usuario autenticado. Si tiene persona asociada,
 * muestra sus inscripciones, requisitos, vigencias, estados y archivos.
 */
export function MiDocumentacionPage() {
  const { usuario } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mi Documentación</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consultá los requisitos documentales de tus disciplinas, su estado de vigencia y tus comprobantes presentados.
        </p>
      </header>

      {usuario?.persona ? (
        <Card className="p-6 shadow-sm">
          <DocumentacionParticipante persona={usuario.persona} puedeCargar={false} />
        </Card>
      ) : (
        <Card className="p-6 text-center text-sm text-slate-500 shadow-sm">
          No tenés una ficha de persona vinculada a tu cuenta de usuario.
        </Card>
      )}
    </div>
  );
}

