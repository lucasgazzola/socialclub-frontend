import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { DocumentosParaRevisar } from './DocumentosParaRevisar';

const mockPendientes = vi.fn();
const mockMutate = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({});
vi.mock('../hooks/useDocumentacion', () => ({
  usePendientesRevision: () => mockPendientes(),
  useRevisarDocumento: () => ({ mutate: mockMutate, mutateAsync: mockMutateAsync, isPending: false }),
}));

const pendiente = {
  id: 50,
  tipo: 'Certificado médico de aptitud física',
  tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
  fechaVencimiento: '2027-03-01T00:00:00.000Z',
  personaId: 10,
  archivoNombre: 'apto.pdf',
  estadoRevision: 'PENDIENTE_REVISION',
  creadoEn: '2026-11-15T12:00:00.000Z',
  persona: { id: 10, nombre: 'Lucía', apellido: 'Vázquez', dni: '30000003', inscripciones: [{ disciplina: { id: 4, nombre: 'Natación' } }] },
};

describe('TASK-60 · Documentación para revisar (panel)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no ocupa lugar si no hay nada para revisar', () => {
    mockPendientes.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { container } = renderWithProviders(<DocumentosParaRevisar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lista lo que subieron los titulares y permite aprobarlo', async () => {
    const user = userEvent.setup();
    mockPendientes.mockReturnValue({ data: [pendiente], isLoading: false, isError: false });
    renderWithProviders(<DocumentosParaRevisar />);

    expect(screen.getByText('Vázquez, Lucía')).toBeInTheDocument();
    expect(screen.getByText('Natación')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver archivo/ })).toHaveAttribute('href', expect.stringContaining('/documentacion/50/archivo'));

    await user.click(screen.getByRole('button', { name: /Aprobar Certificado/ }));
    expect(mockMutate).toHaveBeenCalledWith({ id: 50, aprobar: true });
  });

  it('rechazar exige un motivo y lo envía', async () => {
    const user = userEvent.setup();
    mockPendientes.mockReturnValue({ data: [pendiente], isLoading: false, isError: false });
    renderWithProviders(<DocumentosParaRevisar />);

    await user.click(screen.getByRole('button', { name: /Rechazar Certificado/ }));
    await user.click(screen.getByRole('button', { name: 'Rechazar documento' }));
    expect(screen.getByText(/al menos 5 caracteres/)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Motivo'), 'La foto está borrosa');
    await user.click(screen.getByRole('button', { name: 'Rechazar documento' }));
    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 50, aprobar: false, motivo: 'La foto está borrosa' });
  });
});
