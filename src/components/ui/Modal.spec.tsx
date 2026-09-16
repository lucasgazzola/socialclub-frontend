import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';

describe('Modal', () => {
  it('no renderiza nada mientras open es false', () => {
    render(
      <Modal open={false} title="Título" onClose={vi.fn()}>
        <p>Contenido</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('anuncia título y descripción al diálogo', () => {
    render(
      <Modal open title="Nuevo evento" description="Completá los datos." onClose={vi.fn()}>
        <p>Contenido</p>
      </Modal>,
    );

    // El nombre accesible sale del título vía aria-labelledby.
    expect(screen.getByRole('dialog', { name: /nuevo evento/i })).toBeInTheDocument();
    expect(screen.getByText('Completá los datos.')).toBeInTheDocument();
  });

  it('cierra con Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open title="Título" onClose={onClose}>
        <button type="button">Adentro</button>
      </Modal>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra al hacer clic en el fondo', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open title="Título" onClose={onClose}>
        <p>Contenido</p>
      </Modal>,
    );

    await user.click(screen.getByLabelText('Cerrar modal'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mueve el foco al primer control y lo devuelve al cerrarse', async () => {
    const user = userEvent.setup();

    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir
          </button>
          <Modal open={open} title="Título" onClose={() => setOpen(false)}>
            <button type="button">Adentro</button>
          </Modal>
        </>
      );
    }

    render(<Host />);
    const disparador = screen.getByRole('button', { name: 'Abrir' });

    await user.click(disparador);

    const dialogo = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialogo).getByRole('button', { name: 'Adentro' })).toHaveFocus();
    });

    await user.keyboard('{Escape}');

    // Al cerrar, el foco vuelve a quien abrió el modal.
    await waitFor(() => {
      expect(disparador).toHaveFocus();
    });
  });

  it('mantiene el foco dentro del diálogo al tabular desde el último control', async () => {
    const user = userEvent.setup();

    render(
      <Modal open title="Título" onClose={vi.fn()}>
        <button type="button">Primero</button>
        <button type="button">Último</button>
      </Modal>,
    );

    const dialogo = screen.getByRole('dialog');
    // En orden DOM el primer enfocable es el botón de cerrar del encabezado y
    // el último es el segundo control del contenido.
    const cerrar = within(dialogo).getByRole('button', { name: 'Cerrar' });
    const ultimo = within(dialogo).getByRole('button', { name: 'Último' });

    ultimo.focus();
    await user.tab();

    expect(cerrar).toHaveFocus();
  });
});

describe('ConfirmDialog', () => {
  const props = {
    open: true,
    title: 'Desactivar usuario',
    description: 'No va a poder iniciar sesión.',
    confirmLabel: 'Desactivar',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirma y cancela con los botones del pie', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<ConfirmDialog {...props} onConfirm={onConfirm} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('bloquea los botones mientras la operación está en curso', () => {
    render(<ConfirmDialog {...props} loading />);

    expect(screen.getByRole('button', { name: /desactivar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  it('no cancela con Escape mientras la operación está en curso', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ConfirmDialog {...props} loading onCancel={onCancel} />);

    await user.keyboard('{Escape}');

    expect(onCancel).not.toHaveBeenCalled();
  });
});
