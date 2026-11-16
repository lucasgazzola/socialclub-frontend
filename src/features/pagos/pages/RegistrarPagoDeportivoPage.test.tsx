import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistrarPagoDeportivoPage } from './RegistrarPagoDeportivoPage';
import { usePendientesDeportivos, useRegistrarPagoDeportivo } from '../hooks/usePagosDeportivos';
import type { PendientesDeportivosResponse } from '../types';

const registrarMock = vi.fn();
const buscarMock = vi.hoisted(() => vi.fn());
vi.mock('@/features/inscripcion/hooks/useBuscarParticipante', () => ({
  useBuscarParticipante: () => ({
    participante: { id: 50, nombre: 'Ana', apellido: 'Jugadora', dni: '30111222' },
    buscar: buscarMock,
    limpiar: vi.fn(),
    cargando: false,
    noEncontrado: false,
  }),
}));
vi.mock('../hooks/usePagosDeportivos', () => ({
  usePendientesDeportivos: vi.fn(),
  useRegistrarPagoDeportivo: vi.fn(),
}));

const pendientes: PendientesDeportivosResponse = {
  personaId: 50,
  participanteNombre: 'Ana Jugadora',
  dni: '30111222',
  esSocio: true,
  categoria: 'General',
  categoriaId: 1,
  estadoDeuda: 'MOROSO',
  totalAdeudado: 4000,
  cuotasPendientes: [
    {
      disciplinaId: 3,
      disciplinaNombre: 'Fútbol',
      categoriaNombre: 'Sub-15',
      periodo: '2026-09',
      monto: 4000,
      montoTarifa: 5000,
      descuentoSocioPorcentaje: 20,
      esSocio: true,
      sinTarifa: false,
      inscripcionActiva: true,
    },
    {
      disciplinaId: 3,
      disciplinaNombre: 'Fútbol',
      categoriaNombre: 'Sub-15',
      periodo: '2026-10',
      monto: null,
      montoTarifa: null,
      descuentoSocioPorcentaje: 0,
      esSocio: true,
      sinTarifa: true,
      inscripcionActiva: true,
    },
  ],
};

describe('US-21 · TASK-33 · RegistrarPagoDeportivoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePendientesDeportivos as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: pendientes,
      isLoading: false,
    });
    (useRegistrarPagoDeportivo as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: registrarMock,
      isPending: false,
    });
  });

  function renderPagina() {
    return render(
      <MemoryRouter>
        <RegistrarPagoDeportivoPage />
      </MemoryRouter>,
    );
  }

  it('US-23: con ?dni= (desde Morosos) arranca con el DNI cargado y lo busca', () => {
    buscarMock.mockClear();
    render(
      <MemoryRouter initialEntries={['/cuotas/deportiva/cobrar?dni=30111222']}>
        <RegistrarPagoDeportivoPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Buscar participante por DNI')).toHaveValue('30111222');
    expect(buscarMock).toHaveBeenCalledWith('30111222');
  });

  it('sin ?dni= no busca nada al abrir', () => {
    buscarMock.mockClear();
    renderPagina();

    expect(buscarMock).not.toHaveBeenCalled();
  });

  it('indica si el participante es socio y muestra la categoría de la disciplina', () => {
    renderPagina();

    expect(screen.getByText(/Socio \(General\)/)).toBeInTheDocument();
    expect(screen.getByText('Sub-15')).toBeInTheDocument();
  });

  it('muestra el descuento de socio sobre la tarifa', () => {
    renderPagina();

    const fila = screen.getByText('09/2026').closest('li') as HTMLElement;
    expect(within(fila).getByText('Socio −20 %')).toBeInTheDocument();
    expect(within(fila).getByText('$ 5.000,00')).toHaveClass('line-through');
    expect(within(fila).getByText('$ 4.000,00')).toBeInTheDocument();
  });

  it('un mes sin tarifa figura como "Sin tarifa" y no se puede seleccionar', () => {
    renderPagina();

    const fila = screen.getByText('10/2026').closest('li') as HTMLElement;
    expect(within(fila).getByText('Sin tarifa')).toBeInTheDocument();
    expect(within(fila).getByRole('checkbox')).toBeDisabled();
  });

  it('cobra los meses seleccionados con el total con descuento', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      within(screen.getByText('09/2026').closest('li') as HTMLElement).getByRole('checkbox'),
    );

    expect(screen.getByText('Total seleccionado:').parentElement).toHaveTextContent('$ 4.000,00');
    await user.click(screen.getByRole('button', { name: 'Registrar cobro' }));
    expect(registrarMock).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinaId: 3, periodos: ['2026-09'] }),
    );
  });
});
