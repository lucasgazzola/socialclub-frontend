import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner, StatusTabs, type StatusTabItem } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import {
  useCatalogoInscripcion,
  useMisSolicitudesInscripcion,
} from '../hooks/useSolicitarInscripcion';
import { CatalogoDisciplinasGrid } from '../components/CatalogoDisciplinasGrid';
import { SolicitarInscripcionModal } from '../components/SolicitarInscripcionModal';
import { MisSolicitudesInscripcionTable } from '../components/MisSolicitudesInscripcionTable';
import type { DisciplinaCatalogo } from '../types';

type TabView = 'catalogo' | 'solicitudes';

export function SolicitarInscripcionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const esTabSolicitudes =
    location.pathname === ROUTES.misSolicitudesInscripcion || searchParams.get('tab') === 'solicitudes';

  const tabActual: TabView = esTabSolicitudes ? 'solicitudes' : 'catalogo';
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState<DisciplinaCatalogo | null>(null);

  const {
    data: catalogo,
    isLoading: cargandoCatalogo,
    error: errorCatalogo,
    refetch: recargarCatalogo,
  } = useCatalogoInscripcion();
  const {
    data: solicitudes = [],
    isLoading: cargandoSolicitudes,
    refetch: recargarSolicitudes,
  } = useMisSolicitudesInscripcion();
  const ultimaRuta = useRef(location.pathname);

  useEffect(() => {
    if (ultimaRuta.current === location.pathname) {
      return;
    }

    ultimaRuta.current = location.pathname;
    void Promise.all([recargarCatalogo(), recargarSolicitudes()]);
  }, [location.pathname, recargarCatalogo, recargarSolicitudes]);

  const cambiarTab = (tab: TabView) => {
    navigate(tab === 'solicitudes' ? ROUTES.misSolicitudesInscripcion : ROUTES.solicitarInscripcion);
  };

  const tabs: StatusTabItem<TabView>[] = [
    {
      value: 'catalogo',
      label: 'Catálogo de disciplinas',
      count: catalogo?.items.length,
    },
    {
      value: 'solicitudes',
      label: 'Mis solicitudes',
      count: solicitudes.length,
    },
  ];

  return (
    <div className="space-y-6" data-testid="pagina-solicitar-inscripcion">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Solicitar inscripción
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Postulate a las disciplinas y categorías activas del club desde tu cuenta.
        </p>
      </header>

      <div data-testid="tabs-solicitud-inscripcion">
        <StatusTabs<TabView>
          tabs={tabs}
          value={tabActual}
          onChange={cambiarTab}
        />
      </div>

      {tabActual === 'catalogo' ? (
        cargandoCatalogo ? (
          <div className="flex justify-center py-12" data-testid="spinner-catalogo">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : errorCatalogo ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorCatalogo.message || 'No se pudo cargar el catálogo de disciplinas.'}
          </div>
        ) : (
          <CatalogoDisciplinasGrid
            disciplinas={catalogo?.items ?? []}
            onSeleccionar={(d) => setDisciplinaSeleccionada(d)}
            esSocio={catalogo?.esSocio}
          />
        )
      ) : cargandoSolicitudes ? (
        <div className="flex justify-center py-12" data-testid="spinner-solicitudes">
          <Spinner className="h-8 w-8 text-brand-600" />
        </div>
      ) : (
        <MisSolicitudesInscripcionTable solicitudes={solicitudes} />
      )}

      {disciplinaSeleccionada && (
        <SolicitarInscripcionModal
          disciplina={disciplinaSeleccionada}
          open={!!disciplinaSeleccionada}
          onClose={() => setDisciplinaSeleccionada(null)}
          esSocio={catalogo?.esSocio}
        />
      )}
    </div>
  );
}
