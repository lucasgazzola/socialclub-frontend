import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditarSocioModal } from './EditarSocioModal';
import { useEditarSocio, useSocio } from '../hooks/useSocios';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../hooks/useSocios', () => ({ useSocio: vi.fn(), useEditarSocio: vi.fn() }));
vi.mock('./SocioForm', () => ({
  SocioForm: ({ onSubmit, onCancel, submitLabel }: { onSubmit: (d: unknown) => Promise<void>; onCancel: () => void; submitLabel: string }) => (
    <div>
      <button type="button" onClick={() => void onSubmit({ nombre: 'Ana' })}>{submitLabel}</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));
vi.mock('../types', () => ({ socioToFormData: (s: unknown) => s }));

const editarMock = vi.fn();
const mockHook = (hook: unknown) => hook as ReturnType<typeof vi.fn>;

describe('US-13 · DT-20 · EditarSocioModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editarMock.mockResolvedValue({});
    mockHook(useEditarSocio).mockReturnValue({ mutateAsync: editarMock });
    mockHook(useSocio).mockReturnValue({ data: { id: 5, nombre: 'Ana', apellido: 'López' }, isLoading: false });
  });

  it('edita el socio en un modal y lo cierra al guardar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditarSocioModal socioId={5} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Editar socio' })).toBeInTheDocument();
    expect(screen.getByText('López, Ana')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(editarMock).toHaveBeenCalledWith({ nombre: 'Ana' });
  });

  it('no se muestra sin socio a editar', () => {
    render(<EditarSocioModal socioId={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
