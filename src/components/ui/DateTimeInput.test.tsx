import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { enmascararHora } from '@/lib/utils/fecha';
import { DateTimeInput } from './DateTimeInput';

function Controlado({ inicial = '', onChange }: { inicial?: string; onChange?: (v: string) => void }) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <label htmlFor="inicio">Inicio</label>
      <DateTimeInput
        id="inicio"
        etiquetaHora="Hora de inicio"
        value={valor}
        onChange={(v) => {
          setValor(v);
          onChange?.(v);
        }}
      />
      <output data-testid="valor">{valor}</output>
    </>
  );
}

/** DT-40 · Fecha y hora sin depender del idioma del navegador. */
describe('DT-40 · DateTimeInput', () => {
  it('arma el valor de datetime-local con fecha dd/mm/aaaa y hora hh:mm', async () => {
    const user = userEvent.setup();
    render(<Controlado />);

    await user.type(screen.getByLabelText('Inicio', { selector: '#inicio' }), '15012027');
    expect(screen.getByTestId('valor')).toHaveTextContent('');
    expect(screen.getByText('Falta la hora')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Hora de inicio'), '1830');
    expect(screen.getByLabelText('Hora de inicio')).toHaveValue('18:30');
    expect(screen.getByTestId('valor')).toHaveTextContent('2027-01-15T18:30');
  });

  it('muestra un valor existente (p. ej. al editar)', () => {
    render(<Controlado inicial="2026-11-15T09:05" />);
    expect(screen.getByLabelText('Inicio', { selector: '#inicio' })).toHaveValue('15/11/2026');
    expect(screen.getByLabelText('Hora de inicio')).toHaveValue('09:05');
  });

  it('rechaza una hora inexistente y no emite valor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlado onChange={onChange} />);

    await user.type(screen.getByLabelText('Inicio', { selector: '#inicio' }), '15012027');
    await user.type(screen.getByLabelText('Hora de inicio'), '2575');

    expect(screen.getByText('La hora no es válida (00:00 a 23:59)')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('la máscara de hora solo deja dígitos y agrega los dos puntos', () => {
    expect(enmascararHora('9')).toBe('9');
    expect(enmascararHora('183')).toBe('18:3');
    expect(enmascararHora('18:30hs')).toBe('18:30');
  });
});
