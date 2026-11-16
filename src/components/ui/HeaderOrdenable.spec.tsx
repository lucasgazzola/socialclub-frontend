import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderOrdenable } from './HeaderOrdenable';

describe('HeaderOrdenable', () => {
  it('renderiza el encabezado th con estado neutral por defecto', () => {
    const onOrdenar = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <HeaderOrdenable
              campo="nombre"
              label="Nombre"
              onOrdenar={onOrdenar}
            />
          </tr>
        </thead>
      </table>,
    );

    const th = screen.getByRole('columnheader', { name: /Nombre/i });
    expect(th).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(screen.getByRole('button', { name: /Nombre/i }));
    expect(onOrdenar).toHaveBeenCalledWith('nombre');
  });

  it('renderiza estado ascendente con aria-sort e ícono correspondiente', () => {
    render(
      <table>
        <thead>
          <tr>
            <HeaderOrdenable
              campo="fecha"
              label="Fecha"
              ordenarPor="fecha"
              orden="asc"
              align="right"
            />
          </tr>
        </thead>
      </table>,
    );

    const th = screen.getByRole('columnheader', { name: /Fecha/i });
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    expect(th).toHaveClass('text-right');
  });

  it('renderiza estado descendente y alineación centrada', () => {
    render(
      <table>
        <thead>
          <tr>
            <HeaderOrdenable
              campo="monto"
              label="Monto"
              ordenarPor="monto"
              orden="desc"
              align="center"
              className="custom-class"
            />
          </tr>
        </thead>
      </table>,
    );

    const th = screen.getByRole('columnheader', { name: /Monto/i });
    expect(th).toHaveAttribute('aria-sort', 'descending');
    expect(th).toHaveClass('text-center');
    expect(th).toHaveClass('custom-class');
  });
});
