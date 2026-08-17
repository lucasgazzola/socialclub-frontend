import { useNavigate, useParams } from 'react-router-dom';
import { Card, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { MemberForm } from '../components/MemberForm';
import { useEditarSocio, useSocio } from '../hooks/useMembers';
import { socioToFormData } from '../types';

export function EditMemberPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const navigate = useNavigate();

  const { data: socio, isLoading } = useSocio(id);
  const { mutateAsync } = useEditarSocio(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        El socio no existe.
      </div>
    );
  }

  const handleSubmit = async (data: Parameters<typeof mutateAsync>[0]) => {
    await mutateAsync(data);
    navigate(ROUTES.members, { state: { mensaje: 'Socio actualizado correctamente.' } });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Editar socio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modificá los datos de <strong>{socio.lastName}, {socio.name}</strong>.
        </p>
      </header>

      <Card className="p-6">
        <MemberForm
          defaultValues={socioToFormData(socio)}
          onSubmit={handleSubmit}
          submitLabel="Guardar Cambios"
        />
      </Card>
    </div>
  );
}
