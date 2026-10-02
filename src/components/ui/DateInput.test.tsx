import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateInput } from './DateInput';

function Controlado({ inicial = '', onChange = vi.fn() }: { inicial?: string; onChange?: (iso: string) => void }) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <DateInput
        label="Fecha"
        value={valor}
        onChange={(iso) => {
          setValor(iso);
          onChange(iso);
        }}
      />
      <output data-testid="iso">{valor}</output>
      <button type="button" onClick={() => setValor('2025-12-31')}>Cambiar desde afuera</button>
    </>
  );
}

describe('DT-40 · DateInput', () => {
  it('muestra el valor ISO como dd/mm/aaaa', () => {
    render(<Controlado inicial="2026-10-01" />);
    expect(screen.getByLabelText('Fecha')).toHaveValue('01/10/2026');
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('placeholder', 'dd/mm/aaaa');
  });

  it('acepta lo escrito como dd/mm/aaaa y entrega ISO', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlado onChange={onChange} />);

    await user.type(screen.getByLabelText('Fecha'), '03052011');

    expect(screen.getByLabelText('Fecha')).toHaveValue('03/05/2011');
    expect(screen.getByTestId('iso')).toHaveTextContent('2011-05-03');
    expect(onChange).toHaveBeenLastCalledWith('2011-05-03');
  });

  it('entrega vacío mientras la fecha está incompleta', async () => {
    const user = userEvent.setup();
    render(<Controlado />);

    await user.type(screen.getByLabelText('Fecha'), '0305');

    expect(screen.getByLabelText('Fecha')).toHaveValue('03/05');
    expect(screen.getByTestId('iso')).toBeEmptyDOMElement();
  });

  it('avisa si la fecha completa no existe', async () => {
    const user = userEvent.setup();
    render(<Controlado />);

    await user.type(screen.getByLabelText('Fecha'), '31022026');

    expect(screen.getByText('La fecha no es válida')).toBeInTheDocument();
    expect(screen.getByTestId('iso')).toBeEmptyDOMElement();
  });

  it('refleja un cambio de valor hecho desde afuera (ej. reset del formulario)', async () => {
    const user = userEvent.setup();
    render(<Controlado inicial="2026-10-01" />);

    await user.click(screen.getByRole('button', { name: 'Cambiar desde afuera' }));

    expect(screen.getByLabelText('Fecha')).toHaveValue('31/12/2025');
  });

  it('muestra el error del formulario', () => {
    render(<DateInput label="Fecha" value="" onChange={vi.fn()} error="La fecha es obligatoria" />);
    expect(screen.getByText('La fecha es obligatoria')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('aria-invalid', 'true');
  });
});
