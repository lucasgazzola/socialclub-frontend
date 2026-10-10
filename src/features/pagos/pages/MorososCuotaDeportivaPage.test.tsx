import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MorososCuotaDeportivaPage } from './MorososCuotaDeportivaPage';
import { useMorososCuotaDeportiva } from '../hooks/useMorososCuotaDeportiva';
import type { MorososCuotaDeportivaResponse } from '../types';

vi.mock('../hooks/useMorososCuotaDeportiva', () => ({ useMorososCuotaDeportiva: vi.fn() }));
vi.mock('@/features/disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    disciplinas: [
      { id: 1, nombre: 'Fútbol', activo: true, categorias: [] },
      { id: 2, nombre: 'Natación', activo: true, categorias: [] },
    ],
    cargando: false,
    error: null,
  }),
}));

const respuesta: MorososCuotaDeportivaResponse = {
  total: 1,
  deudaTotal: 35000,
  diaVencimiento: 10,
  items: [
    {
      personaId: 7,
      nombreCompleto: 'Ana Gómez',
      nombre: 'Ana',
      apellido: 'Gómez',
      dni: '30111222',
      email: 'ana@club.local',
      telefono: null,
      cantidadPeriodos: 3,
      montoTotalDeuda: 35000,
      disciplinas: [
        {
          disciplinaId: 1,
          disciplinaNombre: 'Fútbol',
          categoriaNombre: 'Primera',
          inscripcionActiva: true,
          cantidadPeriodos: 2,
          montoAdeudado: 20000,
          cuotas: [
            { periodo: '2026-08', fechaVencimiento: '2026-08-10', monto: 10000, estado: 'VENCIDA' },
            { periodo: '2026-09', fechaVencimiento: '2026-09-10', monto: 10000, estado: 'VENCIDA' },
          ],
        },
        {
          disciplinaId: 2,
          disciplinaNombre: 'Natación',
          categoriaNombre: null,
          inscripcionActiva: false,
          cantidadPeriodos: 1,
          montoAdeudado: 15000,
          cuotas: [
            { periodo: '2026-09', fechaVencimiento: '2026-09-10', monto: 15000, estado: 'VENCIDA' },
          ],
        },
      ],
    },
  ],
};

function UbicacionActual() {
  const { pathname, search } = useLocation();
  return <p data-testid="ubicacion">{`${pathname}${search}`}</p>;
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/cuotas/deportiva/morosos']}>
      <Routes>
        <Route path="/cuotas/deportiva/morosos" element={<MorososCuotaDeportivaPage />} />
        <Route path="*" element={<UbicacionActual />} />
      </Routes>
    </MemoryRouter>,
  );
}

const mockHook = vi.mocked(useMorososCuotaDeportiva);

describe('US-23 · MorososCuotaDeportivaPage', () => {
  beforeEach(() => {
    mockHook.mockReset();
    mockHook.mockReturnValue({
      data: respuesta,
      isLoading: false,
      isError: false,
      error: null,
    } as never);
  });

  it('muestra el resumen, el vencimiento y por moroso: nombre, DNI, deuda por disciplina, períodos y total', () => {
    renderPagina();

    expect(screen.getByText(/La cuota de cada mes vence el día 10/)).toBeInTheDocument();
    expect(screen.getByTestId('total-morosos')).toHaveTextContent('1');
    expect(screen.getByTestId('deuda-total')).toHaveTextContent('35.000');
    const fila = screen.getByRole('row', { name: /Ana Gómez/ });
    expect(within(fila).getByText('30111222')).toBeInTheDocument();
    expect(within(fila).getByText('Fútbol')).toBeInTheDocument();
    expect(within(fila).getByText('Natación')).toBeInTheDocument();
    expect(within(fila).getByText(/2 per\. · \$\s?20\.000/)).toBeInTheDocument();
    expect(within(fila).queryByText(/disciplinas? más/)).not.toBeInTheDocument();
  });

  it('el detalle muestra cada cuota adeudada con período, vencimiento, importe y estado, por disciplina', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole('button', { name: 'Ver detalle de Ana Gómez' }));

    const futbol = screen.getByRole('region', { name: 'Cuotas adeudadas de Fútbol' });
    const filas = within(futbol).getAllByRole('row').slice(1);
    expect(filas.map((f) => f.textContent)).toEqual([
      expect.stringContaining('08/2026'),
      expect.stringContaining('09/2026'),
    ]);
    expect(filas[0]).toHaveTextContent('10/08/2026');
    expect(filas[0]).toHaveTextContent('10.000');
    expect(filas[0]).toHaveTextContent('Vencida · impaga');
    const natacion = screen.getByRole('region', { name: 'Cuotas adeudadas de Natación' });
    expect(within(natacion).getByText('Dada de baja')).toBeInTheDocument();
  });

  it('con más de dos disciplinas muestra dos en la fila y el resto en el detalle', async () => {
    const user = userEvent.setup();
    const base = respuesta.items[0].disciplinas[0];
    const nombres = ['Fútbol', 'Natación', 'Gimnasio', 'Básquet'];
    mockHook.mockReturnValue({
      data: {
        ...respuesta,
        items: [
          {
            ...respuesta.items[0],
            disciplinas: nombres.map((disciplinaNombre, i) => ({
              ...base,
              disciplinaId: i + 1,
              disciplinaNombre,
            })),
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    renderPagina();

    const fila = screen.getByRole('row', { name: /Ana Gómez/ });
    expect(within(fila).getByText('Fútbol')).toBeInTheDocument();
    expect(within(fila).getByText('Natación')).toBeInTheDocument();
    expect(within(fila).queryByText('Gimnasio')).not.toBeInTheDocument();

    await user.click(within(fila).getByRole('button', { name: '+2 disciplinas más' }));

    for (const nombre of nombres) {
      expect(
        screen.getByRole('region', { name: `Cuotas adeudadas de ${nombre}` }),
      ).toBeInTheDocument();
    }
    expect(within(fila).queryByRole('button', { name: /disciplinas más/ })).not.toBeInTheDocument();
  });

  it('filtra por disciplina, busca y ordena pasando los filtros a la consulta', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.selectOptions(screen.getByLabelText('Filtrar por disciplina'), '2');
    await user.type(screen.getByLabelText('Buscar moroso por nombre, apellido o DNI'), 'Gómez');
    await user.selectOptions(screen.getByLabelText('Ordenar listado de morosos'), 'periodos-asc');

    expect(mockHook).toHaveBeenLastCalledWith({
      busqueda: 'Gómez',
      disciplinaId: 2,
      ordenarPor: 'periodos',
      orden: 'asc',
    });
  });

  it('sin morosos informa que no se registran', () => {
    mockHook.mockReturnValue({
      data: { total: 0, deudaTotal: 0, diaVencimiento: 10, items: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as never);

    renderPagina();

    expect(screen.getByText('No se registran morosos de cuota deportiva')).toBeInTheDocument();
  });

  it('«Cobrar» abre el cobro de cuota deportiva con el DNI del moroso', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole('button', { name: /Cobrar/ }));

    expect(screen.getByTestId('ubicacion')).toHaveTextContent(
      '/cuotas/deportiva/cobrar?dni=30111222',
    );
  });

  it('muestra el error de la consulta', () => {
    mockHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('No tenés permisos suficientes para esta operación'),
    } as never);

    renderPagina();

    expect(screen.getByText(/No tenés permisos suficientes/)).toBeInTheDocument();
  });
});
