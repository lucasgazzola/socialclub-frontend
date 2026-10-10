import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoFinancieroPage } from './EstadoFinancieroPage';
import { useEstadoFinanciero } from '../hooks/useEstadoFinanciero';
import type { EstadoFinanciero } from '../types';

vi.mock('../hooks/useEstadoFinanciero', () => ({ useEstadoFinanciero: vi.fn() }));
vi.mock('@/features/disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    disciplinas: [{ id: 2, nombre: 'Natación', activo: true, categorias: [] }],
    cargando: false,
    error: null,
  }),
}));

const reporte: EstadoFinanciero = {
  desde: '2026-07',
  hasta: '2026-09',
  disciplinaId: null,
  diaVencimiento: 10,
  generadoEn: '2026-10-10T12:00:00.000Z',
  totales: {
    recaudado: 75000,
    adeudado: 50000,
    morosos: 2,
    porcentajeCobranza: 60,
    ingresadoPorFechaDeCobro: 80000,
  },
  porConcepto: [
    {
      concepto: 'CUOTA_SOCIAL',
      recaudado: 40000,
      adeudado: 40000,
      morosos: 2,
      porcentajeCobranza: 50,
    },
    {
      concepto: 'CUOTA_DEPORTIVA',
      recaudado: 35000,
      adeudado: 10000,
      morosos: 1,
      porcentajeCobranza: 77.8,
    },
  ],
  porDisciplina: [
    {
      disciplinaId: 2,
      disciplinaNombre: 'Natación',
      recaudado: 35000,
      adeudado: 10000,
      morosos: 1,
      porcentajeCobranza: 77.8,
    },
  ],
  porMes: [
    { periodo: '2026-07', recaudado: 30000, adeudado: 0 },
    { periodo: '2026-08', recaudado: 25000, adeudado: 20000 },
    { periodo: '2026-09', recaudado: 20000, adeudado: 30000 },
  ],
};

const mockHook = vi.mocked(useEstadoFinanciero);
const ultimaConsulta = () => mockHook.mock.calls.at(-1)!;

function renderPagina() {
  return render(
    <MemoryRouter>
      <EstadoFinancieroPage />
    </MemoryRouter>,
  );
}

describe('US-35 · EstadoFinancieroPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 9, 10) });
    mockHook.mockReset();
    mockHook.mockReturnValue({
      data: reporte,
      isLoading: false,
      isError: false,
      error: null,
    } as never);
  });

  it('muestra total recaudado, total adeudado, morosos y porcentaje de cobranza', () => {
    renderPagina();

    expect(screen.getByTestId('total-recaudado')).toHaveTextContent('75.000');
    expect(screen.getByText(/por fecha de cobro: \$\s?80\.000/)).toBeInTheDocument();
    expect(screen.getByTestId('total-adeudado')).toHaveTextContent('50.000');
    expect(screen.getByTestId('total-morosos')).toHaveTextContent('2');
    expect(screen.getByTestId('porcentaje-cobranza')).toHaveTextContent('60 %');
  });

  it('arranca en el trimestre en curso', () => {
    renderPagina();

    expect(ultimaConsulta()).toEqual([
      { desde: '2026-10', hasta: '2026-12', disciplinaId: undefined },
      true,
    ]);
  });

  it('permite elegir un mes, un trimestre o un rango personalizado', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPagina();

    await user.selectOptions(screen.getByLabelText('Trimestre'), '3');
    expect(ultimaConsulta()[0]).toMatchObject({ desde: '2026-07', hasta: '2026-09' });

    await user.click(screen.getByRole('tab', { name: 'Mes' }));
    await user.selectOptions(screen.getByLabelText('Mes'), '8');
    expect(ultimaConsulta()[0]).toMatchObject({ desde: '2026-08', hasta: '2026-08' });

    await user.click(screen.getByRole('tab', { name: 'Rango' }));
    await user.selectOptions(screen.getByLabelText('Mes desde'), '3');
    await user.selectOptions(screen.getByLabelText('Mes hasta'), '9');
    expect(ultimaConsulta()[0]).toMatchObject({ desde: '2026-03', hasta: '2026-09' });
  });

  it('no consulta un rango con «desde» posterior a «hasta» y lo avisa', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPagina();

    await user.click(screen.getByRole('tab', { name: 'Rango' }));
    await user.selectOptions(screen.getByLabelText('Mes desde'), '11');

    expect(screen.getByRole('alert')).toHaveTextContent(
      '«Desde» no puede ser posterior a «hasta».',
    );
    expect(ultimaConsulta()[1]).toBe(false);
  });

  it('filtra por disciplina: consulta solo su cuota deportiva y lo indica', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPagina();

    await user.selectOptions(screen.getByLabelText('Filtrar por disciplina'), '2');

    expect(ultimaConsulta()[0]).toMatchObject({ disciplinaId: 2 });
    expect(screen.getByTestId('descripcion-reporte')).toHaveTextContent(
      'solo cuota deportiva de Natación',
    );
  });

  it('abre el resultado por concepto, por disciplina y por mes, con acceso a los morosos', () => {
    renderPagina();

    const conceptos = screen.getByRole('table', { name: 'Estado por concepto' });
    expect(within(conceptos).getByText('Cuota social')).toBeInTheDocument();
    expect(
      within(conceptos).getByRole('link', { name: /morosos de cuota deportiva \(1\)/ }),
    ).toHaveAttribute('href', '/cuotas/deportiva/morosos');
    expect(
      within(screen.getByRole('table', { name: 'Cuota deportiva por disciplina' })).getByText(
        'Natación',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('barra-2026-08')).toBeInTheDocument();
  });

  it('el gráfico tiene su versión en tabla', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPagina();

    await user.click(screen.getByText('Ver como tabla'));

    expect(screen.getByRole('cell', { name: 'agosto 2026' })).toBeInTheDocument();
  });

  it('informa si el reporte no se pudo generar', () => {
    mockHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('El reporte abarca como máximo 36 meses.'),
    } as never);

    renderPagina();

    expect(
      screen.getByText(/No se pudo generar el reporte: El reporte abarca/),
    ).toBeInTheDocument();
  });
});
