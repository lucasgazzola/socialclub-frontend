import { useState, useEffect } from 'react';
import { Download, FileText, Search, Ticket } from 'lucide-react';
import { Badge, Button, Card, Input, Spinner, TablePagination } from '@/components/ui';
import { QRCode } from '../components/QRCode';
import { useMisEntradas } from '../hooks/useEntradas';
import { descargarEntradaPdf, descargarQR } from '../utils/descargarEntradaPdf';
import type { EstadoEntrada } from '../types';

function renderEstadoBadge(estado: EstadoEntrada) {
  if (estado === 'VALIDA') {
    return (
      <Badge
        variant="success"
        className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
      >
        Válida
      </Badge>
    );
  }
  if (estado === 'USADA') {
    return (
      <Badge
        variant="secondary"
        className="bg-slate-100 text-slate-600 ring-1 ring-slate-500/20"
      >
        Usada
      </Badge>
    );
  }
  return (
    <Badge
      variant="warning"
      className="bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
    >
      Vencida
    </Badge>
  );
}

export function MisEntradasPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagina(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useMisEntradas({
    page: pagina,
    limit: porPagina,
    search: debouncedSearch.trim() || undefined,
  });

  const entradas = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis entradas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visualizá y descargá tus códigos QR de acceso en formato PDF o imagen.
        </p>
      </header>

      <div className="max-w-md">
        <Input
          data-testid="buscar-entradas-input"
          placeholder="Buscar por nombre de evento..."
          leftIcon={<Search />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar tus entradas.
        </div>
      ) : entradas.length > 0 ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entradas.map((entrada) => {
              const esNoVigente = entrada.estado === 'USADA' || entrada.estado === 'EXPIRADA';

              return (
                <Card
                  key={entrada.id}
                  data-testid={`entrada-card-${entrada.id}`}
                  className={`flex flex-col items-center p-5 text-center transition-colors ${
                    esNoVigente ? 'grayscale opacity-75 bg-slate-50/80 border-slate-200' : ''
                  }`}
                >
                  <div className="mb-2 flex w-full items-center justify-between">
                    <Ticket size={20} className={esNoVigente ? 'text-slate-400' : 'text-brand-700'} />
                    <div data-testid={`entrada-badge-${entrada.id}`}>
                      {renderEstadoBadge(entrada.estado)}
                    </div>
                  </div>

                  <h2 className="font-semibold text-slate-900">{entrada.evento?.nombre ?? 'Evento'}</h2>

                  <div className={`mt-3 ${esNoVigente ? 'opacity-40' : ''}`}>
                    <QRCode value={entrada.token} size={180} />
                  </div>

                  <p className="mt-3 break-all font-mono text-xs text-slate-500">{entrada.token}</p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button
                      data-testid={`btn-descargar-pdf-${entrada.id}`}
                      variant="primary"
                      size="sm"
                      disabled={esNoVigente}
                      onClick={() => descargarEntradaPdf(entrada)}
                    >
                      <FileText size={14} /> Descargar PDF
                    </Button>
                    <Button
                      data-testid={`btn-descargar-qr-${entrada.id}`}
                      variant="secondary"
                      size="sm"
                      disabled={esNoVigente}
                      onClick={() => descargarQR(entrada)}
                    >
                      <Download size={14} /> Descargar QR
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <TablePagination
            pagina={pagina}
            porPagina={porPagina}
            total={total}
            isFetching={isFetching}
            onChangePagina={(nuevaPagina) => setPagina(nuevaPagina)}
            onChangePorPagina={(nuevoPorPagina) => {
              setPorPagina(nuevoPorPagina);
              setPagina(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {debouncedSearch ? 'No se encontraron entradas para la búsqueda ingresada.' : 'Todavía no tenés entradas adquiridas.'}
        </div>
      )}
    </div>
  );
}
