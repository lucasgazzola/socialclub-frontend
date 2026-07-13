import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { SocioForm } from '../components/SocioForm';
import { useCrearSocio } from '../hooks/useSocios';

export function CrearSocioPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCrearSocio();

  const handleSubmit = async (data: Parameters<typeof mutateAsync>[0]) => {
    await mutateAsync(data);
    navigate(ROUTES.socios, { state: { mensaje: 'Socio registrado correctamente.' } });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo socio</h1>
        <p className="mt-1 text-sm text-slate-500">Completá los datos para registrar un nuevo socio.</p>
      </header>

      <Card className="p-6">
        <SocioForm onSubmit={handleSubmit} submitLabel="Crear Socio" />
      </Card>
    </div>
  );
}