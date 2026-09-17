import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockPasarelaPagoModal } from './MockPasarelaPagoModal';

const SELECTED_MOCK = [{ periodo: '2026-09', monto: 6000, categoriaNombre: 'General' }];

describe('US-10 · MockPasarelaPagoModal Component', () => {
  it('renderiza la pasarela de pago simulada con el monto acumulado', () => {
    render(
      <MockPasarelaPagoModal
        isOpen={true}
        onClose={vi.fn()}
        selectedCuotas={SELECTED_MOCK}
        onConfirmPago={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Pasarela de Pago (Simulación)')).toBeInTheDocument();
    expect(screen.getByText('2026-09')).toBeInTheDocument();
  });

  it('valida datos requeridos de tarjeta al enviar el formulario', async () => {
    const onConfirmMock = vi.fn();

    render(
      <MockPasarelaPagoModal
        isOpen={true}
        onClose={vi.fn()}
        selectedCuotas={SELECTED_MOCK}
        onConfirmPago={onConfirmMock}
        isLoading={false}
      />,
    );

    const btnSubmit = screen.getByRole('button', { name: /Confirmar y Pagar/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(onConfirmMock).not.toHaveBeenCalled();
    });
  });
});
