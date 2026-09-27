import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PerfilSocioPage } from './PerfilSocioPage';

/**
 * US-41: desde Mi Perfil se llega a la página de cambio de contraseña con el
 * botón "Cambiar contraseña" (el formulario ya no se embebe acá).
 *
 * Se mockean el contexto de sesión y el formulario de datos personales: lo que
 * se verifica es la navegación del botón, no el resto de la pantalla.
 */
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: {
      id: 1,
      email: 'socio@test.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      roles: [],
      persona: null,
    },
    cargando: false,
  }),
}));

vi.mock('../components/PerfilSocioForm', () => ({
  PerfilSocioForm: () => <div data-testid="perfil-socio-form" />,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route path="/perfil" element={<PerfilSocioPage />} />
        <Route path="/perfil/cambiar-contrasena" element={<p>Pantalla de cambio</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PerfilSocioPage (US-41)', () => {
  it('muestra el botón "Cambiar contraseña" en la sección de seguridad, sin el formulario embebido', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Seguridad de la cuenta' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument();
    // El formulario vive en su propia página: acá sólo se mockeó el de datos personales.
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
  });

  it('TC-127: el botón navega a la página de cambio de contraseña', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('Pantalla de cambio')).toBeInTheDocument();
  });
});