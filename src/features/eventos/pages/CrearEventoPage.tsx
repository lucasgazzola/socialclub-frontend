import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { EventoForm } from '../components/EventoForm';
import { useCrearEvento } from '../hooks/useEventos';

export function CrearEventoPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCrearEvento();

  const handleSubmit = async (data: Parameters<typeof mutateAsync>[0]) => {
    await mutateAsync(data);
    navigate(ROUTES.eventos, { state: { mensaje: 'Evento creado correctamente.' } });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo evento</h1>
        <p className="mt-1 text-sm text-slate-500">Completá los datos para crear un nuevo evento.</p>
      </header>

      <Card className="p-6">
        <EventoForm onSubmit={handleSubmit} submitLabel="Crear Evento" />
      </Card>
    </div>
  );
}