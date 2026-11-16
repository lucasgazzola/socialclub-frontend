import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal, ModalActions } from './Modal';

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

  it('no roba el foco al primer control cuando el padre re-renderiza y cambia la referencia de onClose', async () => {
    const user = userEvent.setup();

    function FormHost() {
      const [valor, setValor] = useState('');
      return (
        <Modal
          open
          title="Cobro"
          onClose={() => {}} // inline arrow recrea referencia en cada render
        >
          <button type="button">Seleccionar todas</button>
          <input
            aria-label="Observaciones"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </Modal>
      );
    }

    render(<FormHost />);
    const input = screen.getByLabelText('Observaciones');
    await user.click(input);
    expect(input).toHaveFocus();

    // Escribimos varios caracteres consecutivos
    await user.keyboard('hola');

    expect(input).toHaveValue('hola');
    expect(input).toHaveFocus();
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

describe('DT-20 · estándar de modales', () => {
  it('aplica los anchos estándar según el tamaño (por defecto, lg)', () => {
    const { rerender } = render(<Modal open title="Prueba" onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-2xl');

    rerender(<Modal open size="sm" title="Prueba" onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-md');

    rerender(<Modal open size="xl" title="Prueba" onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-4xl');
  });

  it('muestra el ícono del encabezado con el tono indicado, oculto para lectores de pantalla', () => {
    render(<Modal open title="Dar de baja" tone="danger" icon={<svg data-testid="icono" />} onClose={() => {}} />);

    const chip = screen.getByTestId('icono').parentElement;
    expect(chip).toHaveAttribute('aria-hidden', 'true');
    expect(chip).toHaveClass('bg-rose-50');
  });

  it('muestra las acciones del pie', () => {
    render(
      <Modal open title="Prueba" onClose={() => {}} footer={<button type="button">Guardar</button>}>
        Contenido
      </Modal>,
    );

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }).closest('footer')).not.toBeNull();
  });

  it('ModalActions agrupa las acciones de un formulario en el pie fijo', () => {
    render(
      <ModalActions>
        <button type="button">Cancelar</button>
        <button type="submit">Guardar</button>
      </ModalActions>,
    );

    const pie = screen.getByRole('button', { name: 'Guardar' }).parentElement;
    expect(pie).toHaveClass('sticky');
    expect(pie).toHaveClass('sm:justify-end');
  });

  it('ConfirmDialog usa el tamaño chico y el ícono según la variante', () => {
    render(<ConfirmDialog open variant="danger" title="Dar de baja" onConfirm={() => {}} onCancel={() => {}} />);

    const dialogo = screen.getByRole('dialog', { name: 'Dar de baja' });
    expect(dialogo).toHaveClass('sm:max-w-md');
    expect(dialogo.querySelector('[aria-hidden="true"]')).toHaveClass('bg-rose-50');
  });
});
