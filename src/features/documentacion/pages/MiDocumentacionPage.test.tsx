import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiDocumentacionPage } from './MiDocumentacionPage';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../components/DocumentacionParticipante', () => ({
  DocumentacionParticipante: ({ persona, puedeCargar }: any) => (
    <div data-testid="documentacion-participante">
      <span>
        Persona: {persona.nombre} {persona.apellido}
      </span>
      <span>PuedeCargar: {String(puedeCargar)}</span>
    </div>
  ),
}));

describe('DT-28 · MiDocumentacionPage', () => {
  it('renderiza la documentación cuando el usuario tiene persona asociada', () => {
    mockUseAuth.mockReturnValue({
      usuario: {
        id: 1,
        email: 'socio@club.com',
        nombre: 'Valeria',
        apellido: 'Gonzalez',
        persona: { id: 10, nombre: 'Valeria', apellido: 'Gonzalez' },
      },
    });

    render(<MiDocumentacionPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Mi Documentación' })).toBeInTheDocument();
    expect(screen.getByTestId('documentacion-participante')).toBeInTheDocument();
    expect(screen.getByText('Persona: Valeria Gonzalez')).toBeInTheDocument();
    expect(screen.getByText('PuedeCargar: false')).toBeInTheDocument();
  });

  it('muestra mensaje informativo cuando el usuario no tiene persona asociada', () => {
    mockUseAuth.mockReturnValue({
      usuario: {
        id: 2,
        email: 'admin@club.com',
        persona: null,
      },
    });

    render(<MiDocumentacionPage />);

    expect(
      screen.getByText('No tenés una ficha de persona vinculada a tu cuenta de usuario.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('documentacion-participante')).not.toBeInTheDocument();
  });
});

