import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CambiarContrasenaForm } from './CambiarContrasenaForm';

/**
 * US-41 (Cambiar contraseña) — formulario de la página propia.
 *   - TC-118: datos válidos -> PATCH con el payload exacto + confirmación visible
 *   - TC-119: contraseña actual incorrecta (401) -> error del servidor en el form
 *   - TC-120: nueva contraseña sin complejidad -> bloqueada del lado del cliente
 *   - TC-121: confirmación distinta de la nueva -> error en el campo de confirmación
 *   - TC-124: nueva igual a la actual -> error en el campo de nueva contraseña
 *
 * Se usan el `Input`/`Button` y el schema reales: lo que se quiere probar es
 * justamente que ambos están alineados con las reglas del backend. Sólo se
 * mockean la API y los toasts.
 */
const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    usuario: { id: 1, email: 'socio@test.com', roles: [] },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/auth.api', () => ({
  authApi: {
    cambiarContrasena: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { authApi } from '../api/auth.api';
import { toast } from 'sonner';

const datosValidos = {
  passwordActual: 'Socio123!',
  nuevaContrasena: 'Nueva123!',
  confirmarNuevaContrasena: 'Nueva123!',
};

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CambiarContrasenaForm />
    </QueryClientProvider>,
  );
}

async function completarFormulario(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<typeof datosValidos> = {},
) {
  const datos = { ...datosValidos, ...overrides };
  await user.type(screen.getByLabelText('Contraseña actual'), datos.passwordActual);
  await user.type(screen.getByLabelText('Nueva contraseña'), datos.nuevaContrasena);
  await user.type(screen.getByLabelText('Confirmar nueva contraseña'), datos.confirmarNuevaContrasena);
}

describe('CambiarContrasenaForm (US-41)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-118: envía las tres contraseñas, confirma el éxito, cierra la sesión y redirige al login', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.cambiarContrasena).mockResolvedValue(undefined);

    renderForm();
    await completarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    await waitFor(() => expect(authApi.cambiarContrasena).toHaveBeenCalledTimes(1));
    expect(authApi.cambiarContrasena).toHaveBeenCalledWith(datosValidos);

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });

    // Las contraseñas no quedan visibles en el DOM después del éxito.
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('');
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('');
    expect(screen.getByLabelText('Confirmar nueva contraseña')).toHaveValue('');
  });

  it('muestra el error del backend cuando la contraseña actual no coincide', async () => {
    const user = userEvent.setup();
    const errorServidor = Object.assign(new Error('La contraseña actual es incorrecta'), {
      status: 401,
    });
    vi.mocked(authApi.cambiarContrasena).mockRejectedValue(errorServidor);

    renderForm();
    await completarFormulario(user, { passwordActual: 'Otra1234!' });
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('La contraseña actual es incorrecta');
    expect(
      screen.queryByText('Tu contraseña fue actualizada correctamente.'),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('La contraseña actual es incorrecta'),
    );
  });

  it('rechaza una nueva contraseña que no cumple la política y no llama a la API', async () => {
    const user = userEvent.setup();

    renderForm();
    await completarFormulario(user, {
      nuevaContrasena: 'nuevaprueba',
      confirmarNuevaContrasena: 'nuevaprueba',
    });
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    expect(
      await screen.findByText('Debe incluir mayúscula, minúscula, número y un carácter especial'),
    ).toBeInTheDocument();
    expect(authApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('rechaza una nueva contraseña más corta de 8 caracteres', async () => {
    const user = userEvent.setup();

    renderForm();
    await completarFormulario(user, {
      nuevaContrasena: 'Nue1!',
      confirmarNuevaContrasena: 'Nue1!',
    });
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    expect(
      await screen.findByText('La nueva contraseña debe tener al menos 8 caracteres'),
    ).toBeInTheDocument();
    expect(authApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('marca error en la confirmación cuando no coincide con la nueva contraseña', async () => {
    const user = userEvent.setup();

    renderForm();
    await completarFormulario(user, { confirmarNuevaContrasena: 'Distinta123!' });
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    expect(
      await screen.findByText('La confirmación no coincide con la nueva contraseña'),
    ).toBeInTheDocument();
    expect(authApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('impide reutilizar la contraseña actual como contraseña nueva', async () => {
    const user = userEvent.setup();

    renderForm();
    await completarFormulario(user, {
      nuevaContrasena: datosValidos.passwordActual,
      confirmarNuevaContrasena: datosValidos.passwordActual,
    });
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    expect(
      await screen.findByText('La nueva contraseña no puede ser igual a la actual'),
    ).toBeInTheDocument();
    expect(authApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('exige los tres campos cuando el formulario se envía vacío', async () => {
    const user = userEvent.setup();

    renderForm();
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    expect(await screen.findByText('La contraseña actual es obligatoria')).toBeInTheDocument();
    expect(
      await screen.findByText('La nueva contraseña debe tener al menos 8 caracteres'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Debes confirmar la nueva contraseña')).toBeInTheDocument();
    expect(authApi.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('deshabilita el botón mientras la solicitud está en vuelo', async () => {
    const user = userEvent.setup();
    let resolver: () => void = () => undefined;
    vi.mocked(authApi.cambiarContrasena).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolver = resolve;
        }),
    );

    renderForm();
    await completarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Guardar nueva contraseña' }));

    const boton = await screen.findByRole('button', { name: 'Guardando contraseña…' });
    expect(boton).toBeDisabled();

    resolver();
    expect(await screen.findByRole('button', { name: 'Guardar nueva contraseña' })).toBeEnabled();
  });

});
