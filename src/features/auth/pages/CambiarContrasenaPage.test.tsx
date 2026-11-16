import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CambiarContrasenaPage } from './CambiarContrasenaPage';

/**
 * US-41: la sección de seguridad de Mi Perfil pasó a ser una página propia.
 *   - TC-127: la página muestra su título y el formulario de cambio
 *
 * Se mockea el formulario (tiene su propio spec) para que el test verifique
 * sólo lo que aporta la página: encabezado y montaje del form.
 */
vi.mock('../components/CambiarContrasenaForm', () => ({
  CambiarContrasenaForm: () => <div data-testid="cambiar-contrasena-form" />,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/perfil/cambiar-contrasena']}>
      <Routes>
        <Route path="/perfil/cambiar-contrasena" element={<CambiarContrasenaPage />} />
        <Route path="/perfil" element={<p>Pantalla de Mi Perfil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CambiarContrasenaPage (US-41)', () => {
  it('TC-127: renderiza el título de la página y el formulario de cambio de contraseña', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument();
    expect(
      screen.getByText(/Por seguridad tenés que confirmar la contraseña actual/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('cambiar-contrasena-form')).toBeInTheDocument();
  });
});
