import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { PortalDocumentacionPage } from './PortalDocumentacionPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ usuario: { id: 1, email: 'l@club', roles: [], persona: { id: 10, membresias: [] } } }),
}));

const mockHistorial = vi.fn();
const mockSubir = vi.fn().mockResolvedValue({ id: 50, personaId: 10 });
vi.mock('@/features/documentacion/hooks/useDocumentacion', () => ({
  useEstadoDocumental: () => ({
    isLoading: false,
    isError: false,
    data: {
      estado: 'PENDIENTE',
      tiposExigidos: [],
      inscripciones: [
        {
          inscripcionId: 1,
          disciplina: { id: 4, nombre: 'Natación' },
          categoriaDisciplina: null,
          estado: 'PENDIENTE',
          motivos: [],
          habilitadoExcepcionalmenteHasta: null,
          documentos: [
            {
              tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
              etiqueta: 'Certificado médico de aptitud física',
              estado: 'FALTANTE',
              fechaLimite: null,
              fechaVencimiento: null,
            },
          ],
        },
      ],
    },
  }),
  useDocumentacionPorPersona: () => mockHistorial(),
  useSubirMiDocumentacion: () => ({ mutateAsync: mockSubir, isPending: false }),
}));

const enUnMes = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

describe('TASK-60 · Mi documentación en el portal (subida con revisión)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistorial.mockReturnValue({ data: [] });
  });

  it('el titular sube su documento con el endpoint propio (sin personaId) y queda en revisión', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PortalDocumentacionPage />);

    await user.click(screen.getByRole('button', { name: /Cargar/ }));
    fireEvent.change(screen.getByLabelText('Fecha de vencimiento *'), { target: { value: enUnMes() } });
    const archivo = new File(['%PDF'], 'apto.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [archivo] } });
    await user.click(screen.getByRole('button', { name: 'Cargar documentación' }));

    await waitFor(() =>
      expect(mockSubir).toHaveBeenCalledWith({
        payload: { tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA', fechaVencimiento: enUnMes() },
        archivo,
      }),
    );
  });

  it('un documento en revisión no se vuelve a pedir y uno rechazado muestra el motivo', () => {
    mockHistorial.mockReturnValue({
      data: [
        { id: 1, tipo: 'Certificado médico', tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA', fechaVencimiento: null, personaId: 10, creadoEn: '', estadoRevision: 'PENDIENTE_REVISION' },
        { id: 2, tipo: 'Seguro', tipoDocumento: 'SEGURO_COBERTURA_MEDICA', fechaVencimiento: null, personaId: 10, creadoEn: '', estadoRevision: 'RECHAZADO', motivoRechazo: 'Foto borrosa' },
      ],
    });
    renderWithProviders(<PortalDocumentacionPage />);

    expect(screen.queryByRole('button', { name: /^Cargar$/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('En revisión').length).toBeGreaterThan(0);
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
    expect(screen.getByText('Foto borrosa')).toBeInTheDocument();
  });
});
