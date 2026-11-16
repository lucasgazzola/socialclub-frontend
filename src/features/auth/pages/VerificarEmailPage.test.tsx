import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/auth.api';
import { VerificarEmailPage } from './VerificarEmailPage';

vi.mock('../api/auth.api', () => ({
  authApi: {
    consultarVerificacion: vi.fn(),
    verificarEmail: vi.fn(),
  },
}));

function renderPagina(url = '/verificar-email?token=abc') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/verificar-email" element={<VerificarEmailPage />} />
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** DT-54 — Pantalla del enlace de verificación que llega por email. */
describe('VerificarEmailPage (DT-54)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('a una cuenta creada por el club le pide elegir la contraseña y la activa', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.consultarVerificacion).mockResolvedValue({
      nombre: 'Ana',
      email: 'ana@club.local',
      requiereContrasena: true,
      expiraEn: '2026-11-12T12:00:00.000Z',
    });
    vi.mocked(authApi.verificarEmail).mockResolvedValue({
      mensaje: 'Tu cuenta quedó activa. Ya podés iniciar sesión con tu contraseña.',
    });

    renderPagina();

    expect(await screen.findByText(/elegí tu contraseña/i)).toBeInTheDocument();
    expect(authApi.consultarVerificacion).toHaveBeenCalledWith('abc');

    await user.type(screen.getByLabelText('Contraseña'), 'Nueva123!');
    await user.type(screen.getByLabelText('Repetí la contraseña'), 'Nueva123!');
    await user.click(screen.getByRole('button', { name: /activar mi cuenta/i }));

    expect(authApi.verificarEmail).toHaveBeenCalledWith({
      token: 'abc',
      password: 'Nueva123!',
      confirmarPassword: 'Nueva123!',
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/tu cuenta quedó activa/i);
    expect(screen.getByRole('link', { name: /ir a iniciar sesión/i })).toHaveAttribute('href', '/login');
  });

  it('valida la contraseña antes de enviarla', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.consultarVerificacion).mockResolvedValue({
      nombre: 'Ana',
      email: 'ana@club.local',
      requiereContrasena: true,
      expiraEn: '2026-11-12T12:00:00.000Z',
    });

    renderPagina();
    await user.type(await screen.findByLabelText('Contraseña'), 'Nueva123!');
    await user.type(screen.getByLabelText('Repetí la contraseña'), 'Otra123!');
    await user.click(screen.getByRole('button', { name: /activar mi cuenta/i }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(authApi.verificarEmail).not.toHaveBeenCalled();
  });

  it('a quien se registró solo le pide confirmar el email', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.consultarVerificacion).mockResolvedValue({
      nombre: 'Beto',
      email: 'beto@club.local',
      requiereContrasena: false,
      expiraEn: '2026-11-12T12:00:00.000Z',
    });
    vi.mocked(authApi.verificarEmail).mockResolvedValue({
      mensaje: 'Tu email quedó verificado. Ya podés iniciar sesión.',
    });

    renderPagina();
    await user.click(await screen.findByRole('button', { name: /verificar mi email/i }));

    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
    expect(authApi.verificarEmail).toHaveBeenCalledWith({ token: 'abc' });
    expect(await screen.findByRole('status')).toHaveTextContent(/email quedó verificado/i);
  });

  it('explica por qué no sirve un enlace vencido y que el club envía uno nuevo', async () => {
    vi.mocked(authApi.consultarVerificacion).mockRejectedValue(
      new Error('El enlace venció. Pedile al club que te envíe uno nuevo.'),
    );

    renderPagina();

    expect(await screen.findByRole('alert')).toHaveTextContent(/pedile al club/i);
    // DT-54: el reenvío queda del lado del administrador.
    expect(screen.queryByRole('button', { name: /enlace nuevo/i })).not.toBeInTheDocument();
  });

  it('sin token no consulta la API', async () => {
    renderPagina('/verificar-email');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('El enlace no es válido'),
    );
    expect(authApi.consultarVerificacion).not.toHaveBeenCalled();
  });
});
