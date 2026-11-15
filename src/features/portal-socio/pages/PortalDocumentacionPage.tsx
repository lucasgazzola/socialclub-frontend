import { FileText } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DocumentacionParticipante } from '@/features/documentacion/components/DocumentacionParticipante';
import { PortalEmptyState, PortalPageHeader, PortalPanel } from '../components/PortalUI';

export function PortalDocumentacionPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Mi documentación"
        subtitle="Consultá los requisitos documentales de tus disciplinas, fechas de vigencia y comprobantes presentados."
      />

      {usuario?.persona ? (
        <PortalPanel className="portal-socio-embed p-5 sm:p-7">
          <DocumentacionParticipante persona={usuario.persona} puedeCargar={false} />
        </PortalPanel>
      ) : (
        <PortalEmptyState
          icon={<FileText size={22} />}
          title="Sin ficha de persona vinculada"
          description="Cuando te asocies o inscribas en una disciplina del club, tu documentación exigida aparecerá acá."
        />
      )}
    </div>
  );
}
