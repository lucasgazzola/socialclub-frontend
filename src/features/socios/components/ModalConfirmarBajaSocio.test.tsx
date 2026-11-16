import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalConfirmarBajaSocio } from './ModalConfirmarBajaSocio';

describe('ModalConfirmarBajaSocio (US-42)', () => {
  it('no se muestra cuando open es false', () => {
    render(
      <ModalConfirmarBajaSocio
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByText(/Confirmar baja como socio/i)).not.toBeInTheDocument();
  });

  it('muestra la información de advertencia cuando open es true y ejecuta los handlers al hacer clic', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ModalConfirmarBajaSocio
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText(/Confirmar baja como socio/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro de que querés darte de baja\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Inactivo/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: /Sí, confirmar baja/i });
    await user.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
