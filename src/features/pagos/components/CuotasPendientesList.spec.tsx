import { render, screen, fireEvent } from '@testing-library/react';
import { CuotasPendientesList } from './CuotasPendientesList';
import type { CuotaPendiente } from '../types';

const CUOTAS_MOCK: CuotaPendiente[] = [
  { periodo: '2026-08', monto: 5000, categoriaNombre: 'General' },
  { periodo: '2026-09', monto: 5000, categoriaNombre: 'General' },
];

describe('US-10 · CuotasPendientesList Component', () => {
  it('muestra mensaje de estar al día cuando no hay cuotas pendientes', () => {
    render(
      <CuotasPendientesList
        cuotas={[]}
        selectedPeriodos={[]}
        onTogglePeriodo={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onPagar={vi.fn()}
      />,
    );

    expect(screen.getByText(/¡Estás al día con tus cuotas!/i)).toBeInTheDocument();
  });

  it('muestra la lista de cuotas pendientes con sus montos correspondientes (CA 1)', () => {
    render(
      <CuotasPendientesList
        cuotas={CUOTAS_MOCK}
        selectedPeriodos={['2026-08']}
        onTogglePeriodo={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onPagar={vi.fn()}
      />,
    );

    expect(screen.getByText('2026-08')).toBeInTheDocument();
    expect(screen.getByText('2026-09')).toBeInTheDocument();
  });

  it('habilita el botón de pagar cuando hay al menos una cuota seleccionada (CA 2)', () => {
    const onPagarMock = vi.fn();

    render(
      <CuotasPendientesList
        cuotas={CUOTAS_MOCK}
        selectedPeriodos={['2026-08']}
        onTogglePeriodo={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onPagar={onPagarMock}
      />,
    );

    const btnPagar = screen.getByRole('button', { name: /Pagar seleccionadas/i });
    expect(btnPagar).not.toBeDisabled();

    fireEvent.click(btnPagar);
    expect(onPagarMock).toHaveBeenCalledTimes(1);
  });
});
