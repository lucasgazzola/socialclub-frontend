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

  it('muestra el resumen, el vencimiento y por moroso: nombre, DNI, períodos y total (sin columna Deuda por disciplina ni Select)', () => {
    renderPagina();

    expect(screen.getByText(/La cuota de cada mes vence el día 10/)).toBeInTheDocument();
    expect(screen.getByTestId('total-morosos')).toHaveTextContent('1');
    expect(screen.getByTestId('deuda-total')).toHaveTextContent('35.000');
    const fila = screen.getByRole('row', { name: /Ana Gómez/ });
    expect(within(fila).getByText('30.111.222')).toBeInTheDocument();
    expect(within(fila).getByText('3')).toBeInTheDocument();
    expect(within(fila).getByText(/35\.000/)).toBeInTheDocument();

    // Verifica que la antigua columna "Deuda por disciplina" y el antiguo Select no existan
    expect(screen.queryByText(/Deuda por disciplina/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Ordenar listado de morosos/i)).not.toBeInTheDocument();
  });

  it('«Ver historial» navega al historial de cuota deportiva del participante', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole('button', { name: 'Ver historial de Ana Gómez' }));

    expect(screen.getByTestId('ubicacion')).toHaveTextContent(
      '/admin/cuotas/deportiva/historial?personaId=7',
    );
  });

  it('filtra por disciplina, busca y permite ordenar en 3 estados (asc -> desc -> reset)', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.selectOptions(screen.getByLabelText('Filtrar por disciplina'), '2');
    await user.type(screen.getByLabelText('Buscar moroso por nombre, apellido o DNI'), 'Gómez');

    const btnPeriodos = screen.getByRole('button', { name: /Períodos/i });
    // Clic 1: asc
    await user.click(btnPeriodos);
    expect(mockHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        busqueda: 'Gómez',
        disciplinaId: 2,
        ordenarPor: 'periodos',
        orden: 'asc',
      }),
    );

    // Clic 2: desc
    await user.click(btnPeriodos);
    expect(mockHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        busqueda: 'Gómez',
        disciplinaId: 2,
        ordenarPor: 'periodos',
        orden: 'desc',
      }),
    );

    // Clic 3: neutro / reset
    await user.click(btnPeriodos);
    expect(mockHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        busqueda: 'Gómez',
        disciplinaId: 2,
        ordenarPor: undefined,
        orden: undefined,
      }),
    );

    // Probar también ordenamiento por Participante, DNI y Deuda total
    const btnParticipante = screen.getByRole('button', { name: /Participante/i });
    await user.click(btnParticipante);
    expect(mockHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ordenarPor: 'nombre',
        orden: 'asc',
      }),
    );

    const btnDni = screen.getByRole('button', { name: /DNI/i });
    await user.click(btnDni);
    expect(mockHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ordenarPor: 'dni',
        orden: 'asc',
      }),
    );

    const btnMonto = screen.getByRole('button', { name: /Deuda total/i });
    await user.click(btnMonto);
    expect(mockHook).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ordenarPor: 'monto',
        orden: 'asc',
      }),
    );
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
