import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentacionParticipante } from './DocumentacionParticipante';
import { useCrearDocumentacion, useDocumentacionPorPersona } from '../hooks/useDocumentacion';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../hooks/useDocumentacion', () => ({
  useCrearDocumentacion: vi.fn(),
  useDocumentacionPorPersona: vi.fn(),
}));

const crearMock = vi.fn();
const persona = { id: 10, nombre: 'Juan', apellido: 'Pérez' };

/** Fecha de dentro de un año en dd/mm/aaaa y en ISO. */
function fechaFutura() {
  const d = new Date();
  const anio = d.getFullYear() + 1;
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return { texto: `15/${mes}/${anio}`, iso: `${anio}-${mes}-15` };
}

describe('US-24 / DT-11 · DocumentacionParticipante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearMock.mockResolvedValue({ id: 1, personaId: 10 });
    (useCrearDocumentacion as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ mutateAsync: crearMock });
    (useDocumentacionPorPersona as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ id: 3, tipo: 'Apto físico', fechaVencimiento: '2027-03-31T00:00:00.000Z', archivoNombre: null }],
      isLoading: false,
    });
  });

  it('lista la documentación cargada con el vencimiento en dd/mm/aaaa', () => {
    render(<DocumentacionParticipante persona={persona} />);

    expect(useDocumentacionPorPersona).toHaveBeenCalledWith(10);
    expect(screen.getByText('Apto físico')).toBeInTheDocument();
    expect(screen.getByText('Vence: 31/03/2027')).toBeInTheDocument();
  });

  it('carga un documento nuevo para el participante', async () => {
    const user = userEvent.setup();
    const { texto, iso } = fechaFutura();
    render(<DocumentacionParticipante persona={persona} />);

    await user.type(screen.getByLabelText('Tipo de documento'), 'Seguro');
    await user.type(screen.getByLabelText('Fecha de vencimiento'), texto);
    await user.click(screen.getByRole('button', { name: 'Cargar documento' }));

    await waitFor(() => {
      expect(crearMock).toHaveBeenCalledWith({
        payload: { tipo: 'Seguro', fechaVencimiento: iso, personaId: 10 },
        archivo: null,
      });
    });
  });

  it('no envía sin tipo ni fecha de vencimiento', async () => {
    const user = userEvent.setup();
    render(<DocumentacionParticipante persona={persona} />);

    await user.click(screen.getByRole('button', { name: 'Cargar documento' }));

    expect(await screen.findByText('El tipo de documento es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La fecha de vencimiento es obligatoria')).toBeInTheDocument();
    expect(crearMock).not.toHaveBeenCalled();
  });

  it('sin permiso de carga solo muestra la documentación', () => {
    render(<DocumentacionParticipante persona={persona} puedeCargar={false} />);

    expect(screen.queryByRole('button', { name: 'Cargar documento' })).not.toBeInTheDocument();
  });
});
