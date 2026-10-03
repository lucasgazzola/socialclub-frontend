import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertasDocumentacion } from './AlertasDocumentacion';
import { useAlertasDocumentacion } from '../hooks/useDocumentacion';
import type { AlertaDocumentacion } from '../types';

vi.mock('../hooks/useDocumentacion', () => ({
  useAlertasDocumentacion: vi.fn(),
}));
vi.mock('./DocumentacionParticipante', () => ({
  DocumentacionParticipante: ({ persona }: { persona: { id: number; nombre: string; apellido: string } }) => (
    <p>
      Documentación de la persona {persona.id}: {persona.apellido} / {persona.nombre}
    </p>
  ),
}));

const mockHook = useAlertasDocumentacion as unknown as ReturnType<typeof vi.fn>;

const alertas: AlertaDocumentacion[] = [
  {
    clave: '1',
    tipo: 'VENCIDO',
    inscripcionId: 1,
    personaId: 20,
    participante: 'Ruiz, Tomás',
    disciplina: 'Básquet',
    categoria: null,
    tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
    documento: 'Certificado médico de aptitud física',
    fecha: '2026-09-30T00:00:00.000Z',
    diasRestantes: -3,
    mensaje: 'Venció el 30/09/2026',
  },
  {
    clave: '2',
    tipo: 'PRESENTACION_POR_VENCER',
    inscripcionId: 5,
    personaId: 10,
    participante: 'Gómez, Lola',
    disciplina: 'Fútbol',
    categoria: 'Sub-15',
    tipoDocumento: 'AUTORIZACION_PADRES_TUTORES',
    documento: 'Autorización de padres/tutores',
    fecha: '2026-10-10T03:00:00.000Z',
    diasRestantes: 7,
    mensaje: 'Falta presentarlo: el plazo termina en 7 días (10/10/2026)',
  },
];

describe('US-26 · AlertasDocumentacion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook.mockReturnValue({ data: alertas, isLoading: false, isError: false });
  });

  it('muestra participante, disciplina, documento, fecha y estado de cada alerta', () => {
    render(<AlertasDocumentacion />);

    expect(screen.getByText('2 alertas · próximos 10 días')).toBeInTheDocument();
    const filas = screen.getAllByRole('row').slice(1);
    const lola = within(filas[1]);
    expect(lola.getByText('Gómez, Lola')).toBeInTheDocument();
    expect(lola.getByText('Fútbol')).toBeInTheDocument();
    expect(lola.getByText('· Sub-15')).toBeInTheDocument();
    expect(lola.getByText('Autorización de padres/tutores')).toBeInTheDocument();
    expect(lola.getByText('10/10/2026')).toBeInTheDocument();
    expect(lola.getByText('en 7 días')).toBeInTheDocument();
    expect(lola.getByText('Falta presentar')).toBeInTheDocument();

    const tomas = within(filas[0]);
    expect(tomas.getByText('Vencido')).toBeInTheDocument();
    expect(tomas.getByText('hace 3 días')).toBeInTheDocument();
  });

  it('"Ver documentación" abre la documentación del participante', async () => {
    const user = userEvent.setup();
    render(<AlertasDocumentacion />);

    await user.click(screen.getByRole('button', { name: 'Ver documentación de Gómez, Lola' }));

    expect(screen.getByRole('dialog', { name: 'Documentación de Gómez, Lola' })).toBeInTheDocument();
    expect(screen.getByText('Documentación de la persona 10: Gómez / Lola')).toBeInTheDocument();
  });

  it('avisa cuando no hay alertas', () => {
    mockHook.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<AlertasDocumentacion />);

    expect(
      screen.getByText('No hay documentación por vencer ni pendiente en los próximos 10 días.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('avisa si no se pudieron cargar', () => {
    mockHook.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<AlertasDocumentacion />);

    expect(screen.getByText('No se pudieron cargar las alertas de documentación.')).toBeInTheDocument();
  });
});
