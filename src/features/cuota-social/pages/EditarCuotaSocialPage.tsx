import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Spinner } from '@/components/ui';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { CuotaSocialForm } from '../components/CuotaSocialForm';
import { useActualizarCuotaSocial } from '../hooks/useActualizarCuotaSocial';
import { useCuotaSocialById } from '../hooks/useCuotaSocialById';
import type { CuotaSocialFormValues } from '../schemas';
import { ROUTES } from '@/routes/paths';

export function EditarCuotaSocialPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const navigate = useNavigate();

  const { data: categorias = [] } = useCategorias();
  const { data: cuota, isLoading } = useCuotaSocialById(id);
  const actualizarCuota = useActualizarCuotaSocial();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!cuota) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        La configuración de cuota social no existe.
      </div>
    );
  }

  async function handleSubmit(values: CuotaSocialFormValues) {
    if (!cuota) return;
    await actualizarCuota.mutateAsync({
      id: cuota.id,
      payload: { monto: values.monto },
    });
    navigate(ROUTES.cuotaSocial);
  }

  return (
    <div className="space-y-6">
      <header>
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.cuotaSocial)}>
          <ArrowLeft size={16} />
          Volver a Cuota social
        </Button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Editar cuota social</h1>
        <p className="mt-1 text-sm text-slate-500">
          Actualizá el monto de <strong>{cuota.categoria.nombre}</strong> · Período{' '}
          <strong>{cuota.periodoAplicacion}</strong>.
        </p>
      </header>

      <Card className="p-6">
        <CuotaSocialForm
          modo="editar"
          configuracionInicial={cuota}
          categorias={categorias}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
