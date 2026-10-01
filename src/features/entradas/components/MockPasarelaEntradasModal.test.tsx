import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockPasarelaEntradasModal } from './MockPasarelaEntradasModal';

describe('US-52 · MockPasarelaEntradasModal', () => {
  it('muestra cantidad y total de la compra', () => {
    render(
      <MockPasarelaEntradasModal
        isOpen
        onClose={vi.fn()}
        cantidad={2}
        precioUnitario={1500}
        onConfirmPago={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('2 entrada(s)')).toBeInTheDocument();
    expect(screen.getAllByText('$3.000,00')).toHaveLength(2);
  });

  it('no confirma una compra sin datos válidos de tarjeta', async () => {
    const confirmar = vi.fn();
    render(
      <MockPasarelaEntradasModal
        isOpen
        onClose={vi.fn()}
        cantidad={1}
        precioUnitario={1000}
        onConfirmPago={confirmar}
        isLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /confirmar y pagar/i }));

    await waitFor(() => expect(confirmar).not.toHaveBeenCalled());
  });
});
