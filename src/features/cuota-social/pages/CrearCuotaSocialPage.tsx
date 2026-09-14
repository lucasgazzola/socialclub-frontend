import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { CuotaSocialForm } from '../components/CuotaSocialForm';
import { useConfigurarCuotaSocial } from '../hooks/useConfigurarCuotaSocial';
import type { CuotaSocialFormValues } from '../schemas';
import { ROUTES } from '@/routes/paths';

export function CrearCuotaSocialPage() {
  const navigate = useNavigate();
  const { data: categorias = [] } = useCategorias();
  const configurarCuota = useConfigurarCuotaSocial();

  async function handleSubmit(values: CuotaSocialFormValues) {
    await configurarCuota.mutateAsync({
      categoriaId: values.categoriaId,
      monto: values.monto,
      ...(values.periodoAplicacion ? { periodoAplicacion: values.periodoAplicacion } : {}),
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
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nueva cuota social</h1>
        <p className="mt-1 text-sm text-slate-500">
          Elegí la categoría y definí el monto mensual. Los cambios aplican desde el período siguiente.
        </p>
      </header>

      <Card className="p-6">
        <CuotaSocialForm modo="crear" categorias={categorias} onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
