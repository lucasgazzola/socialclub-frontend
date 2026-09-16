import { Coins, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';

export function CuotasHubPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Cuotas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configurá cuotas sociales y deportivas. Elegí el tipo de cuota que querés gestionar.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.cuotaSocial)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate(ROUTES.cuotaSocial);
          }}
          className="cursor-pointer p-6 transition hover:border-brand-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
        >
          <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
            <Users size={20} />
          </div>
          <h2 className="font-medium text-slate-900">Cuota social</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configurá el monto mensual de la cuota social. Los cambios aplican desde el período siguiente.
          </p>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.cuotaDeportiva)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate(ROUTES.cuotaDeportiva);
          }}
          className="cursor-pointer p-6 transition hover:border-brand-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
        >
          <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
            <Coins size={20} />
          </div>
          <h2 className="font-medium text-slate-900">Cuota deportiva</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configurá el monto por disciplina y categoría. Los cambios aplican desde el período siguiente.
          </p>
        </Card>
      </div>
    </div>
  );
}
