import { AlertasDocumentacion } from '../components/AlertasDocumentacion';
import { DocumentosParaRevisar } from '../components/DocumentosParaRevisar';

/**
 * Página dedicada a las notificaciones y alertas de documentación
 * (ADMIN y DELEGADO): documentos pendientes de revisión y alertas de vencimiento.
 */
export function NotificacionesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notificaciones</h1>
        <p className="mt-1 text-sm text-slate-500">
          Documentos subidos por titulares pendientes de revisión y alertas de vencimiento en los próximos 10 días.
        </p>
      </header>

      <DocumentosParaRevisar />
      <AlertasDocumentacion />
    </div>
  );
}
