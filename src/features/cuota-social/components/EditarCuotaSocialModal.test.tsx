import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditarCuotaSocialModal } from './EditarCuotaSocialModal';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { useCuotaSocialById } from '../hooks/useCuotaSocialById';
import { useActualizarCuotaSocial } from '../hooks/useActualizarCuotaSocial';

vi.mock('@/features/socios/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}));

vi.mock('../hooks/useCuotaSocialById', () => ({
  useCuotaSocialById: vi.fn(),
}));

vi.mock('../hooks/useActualizarCuotaSocial', () => ({
  useActualizarCuotaSocial: vi.fn(),
}));

const mockActualizarMutate = vi.fn();

const cuotaFixture = {
  id: 5,
  categoriaId: 1,
  monto: 18000,
  periodoAplicacion: '2026-10',
  activo: true,
  categoria: { id: 1, nombre: 'Pleno' },
};

describe('EditarCuotaSocialModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockActualizarMutate.mockResolvedValue({});

    vi.mocked(useCategorias).mockReturnValue({
      data: [{ id: 1, nombre: 'Pleno' }],
      isLoading: false,
    } as never);

    vi.mocked(useActualizarCuotaSocial).mockReturnValue({
      mutateAsync: mockActualizarMutate,
      isPending: false,
    } as never);

    vi.mocked(useCuotaSocialById).mockReturnValue({
      data: cuotaFixture,
      isLoading: false,
    } as never);
  });

  it('no muestra modal si cuotaId es null', () => {
    render(<EditarCuotaSocialModal cuotaId={null} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra spinner mientras carga la cuota', () => {
    vi.mocked(useCuotaSocialById).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    render(<EditarCuotaSocialModal cuotaId={5} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra error si la cuota no existe', () => {
    vi.mocked(useCuotaSocialById).mockReturnValue({
      data: null,
      isLoading: false,
    } as never);

    render(<EditarCuotaSocialModal cuotaId={5} onClose={onClose} />);
    expect(screen.getByText('La configuración de cuota social no existe.')).toBeInTheDocument();
  });

  it('permite actualizar el monto de la cuota social', async () => {
    const user = userEvent.setup();
    render(<EditarCuotaSocialModal cuotaId={5} onClose={onClose} />);

    expect(screen.getByText(/Pleno · Período 2026-10/i)).toBeInTheDocument();
    const montoInput = screen.getByLabelText(/Monto mensual/i);
    expect(montoInput).toHaveValue(18000);

    await user.clear(montoInput);
    await user.type(montoInput, '22000');

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(mockActualizarMutate).toHaveBeenCalledWith({
        id: 5,
        payload: { monto: 22000 },
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});

