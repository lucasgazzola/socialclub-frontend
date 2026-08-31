import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { z } from 'zod';
import { HacermeSocioForm } from './HacermeSocioForm';

/**
 * US-09 — Tests del formulario "Hacerme socio":
 * - Nombre/apellido/email precargados (solo lectura) desde la cuenta.
 * - Se envía solo DNI + categoría de socio.
 * - Los errores del servidor (DNI/email en uso, "ya sos socio") se muestran.
 */
vi.mock('../schemas', () => {
  const hacermeSocioFormSchema = z.object({
    dni: z.string().min(6, 'El DNI es obligatorio'),
    categoriaId: z.string().min(1, 'La categoría es obligatoria'),
  });
  return { hacermeSocioFormSchema };
});

vi.mock('../hooks/useCategorias', () => ({
  useCategorias: () => ({
    data: [
      { id: 1, nombre: 'Senior' },
      { id: 2, nombre: 'Mayores' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/components/ui', () => ({
  Input: ({
    id,
    label,
    error,
    ...props
  }: { id: string; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
      {error && <p role="alert">{error}</p>}
    </div>
  ),
  Button: ({ children, ...props }: { children?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Select: ({
    children,
    id,
    ...props
  }: { id: string; children?: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) => (
    <select id={id} {...props}>
      {children}
    </select>
  ),
}));

const defaultValues = { nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com' };

describe('HacermeSocioForm (US-09)', () => {
  it('precarga nombre/apellido/email solo lectura y envía DNI + categoría', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<HacermeSocioForm defaultValues={defaultValues} onSubmit={onSubmit} />);

    // Campos precargados desde la cuenta del usuario logueado.
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
    expect(screen.getByLabelText('Apellido')).toHaveValue('Pérez');
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('readonly');

    await user.type(screen.getByLabelText('DNI'), '40123456');
    await user.selectOptions(screen.getByLabelText('Categoría de socio'), '1');
    await user.click(screen.getByRole('button', { name: 'Hacerme socio' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ dni: '40123456', categoriaId: 1 });
  });

  it('muestra el mensaje del servidor cuando el DNI ya está en uso', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error('Ya existe un socio activo con ese DNI'));

    render(<HacermeSocioForm defaultValues={defaultValues} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('DNI'), '30111222');
    await user.selectOptions(screen.getByLabelText('Categoría de socio'), '2');
    await user.click(screen.getByRole('button', { name: 'Hacerme socio' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe un socio activo con ese DNI',
    );
  });

  it('valida que el DNI tenga al menos 6 dígitos antes de enviar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<HacermeSocioForm defaultValues={defaultValues} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('DNI'), '123');
    await user.selectOptions(screen.getByLabelText('Categoría de socio'), '1');
    await user.click(screen.getByRole('button', { name: 'Hacerme socio' }));

    expect(await screen.findByText('El DNI es obligatorio')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});