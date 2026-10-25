import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TablePagination } from './TablePagination';

describe('TablePagination', () => {
  it('renderiza paginación corta (<= 7 páginas) con todas las páginas visibles', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    render(
      <TablePagination
        pagina={2}
        porPagina={10}
        total={50}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    expect(screen.getByText(/Mostrando 11-20 de 50 resultados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 5' })).toBeInTheDocument();
  });

  it('permite cambiar de página con Anterior y Siguiente', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    render(
      <TablePagination
        pagina={2}
        porPagina={10}
        total={30}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(onChangePagina).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(onChangePagina).toHaveBeenCalledWith(3);
  });

  it('deshabilita Anterior en la primera página y Siguiente en la última', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    const { rerender } = render(
      <TablePagination
        pagina={1}
        porPagina={10}
        total={30}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Siguiente/i })).not.toBeDisabled();

    rerender(
      <TablePagination
        pagina={3}
        porPagina={10}
        total={30}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    expect(screen.getByRole('button', { name: /Anterior/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeDisabled();
  });

  it('renderiza elipsis cuando hay muchas páginas (inicio, final y medio)', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    // Inicio: página 2 de 20
    const { rerender } = render(
      <TablePagination
        pagina={2}
        porPagina={10}
        total={200}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );
    expect(screen.getByText('…')).toBeInTheDocument();

    // Final: página 19 de 20
    rerender(
      <TablePagination
        pagina={19}
        porPagina={10}
        total={200}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );
    expect(screen.getByText('…')).toBeInTheDocument();

    // Medio: página 10 de 20 (dos elipsis)
    rerender(
      <TablePagination
        pagina={10}
        porPagina={10}
        total={200}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );
    expect(screen.getAllByText('…')).toHaveLength(2);
  });

  it('dispara onChangePorPagina al cambiar el selector de filas', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    render(
      <TablePagination
        pagina={1}
        porPagina={10}
        total={100}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    const select = screen.getByLabelText(/Filas por página/i);
    fireEvent.change(select, { target: { value: '50' } });
    expect(onChangePorPagina).toHaveBeenCalledWith(50);
  });

  it('muestra estado cuando no hay resultados (total = 0)', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    render(
      <TablePagination
        pagina={1}
        porPagina={10}
        total={0}
        isFetching={true}
        srSummary="0 socios encontrados"
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    expect(screen.getByText(/Mostrando 0-0 de 0 resultados/i)).toBeInTheDocument();
    expect(screen.getByText(/actualizando…/i)).toBeInTheDocument();
  });

  it('permite hacer clic en un número de página directamente', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    render(
      <TablePagination
        pagina={1}
        porPagina={10}
        total={50}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(onChangePagina).toHaveBeenCalledWith(3);
  });

  it('deshabilita controles cuando isFetching es true', () => {
    const onChangePagina = vi.fn();
    const onChangePorPagina = vi.fn();

    render(
      <TablePagination
        pagina={2}
        porPagina={10}
        total={50}
        isFetching={true}
        onChangePagina={onChangePagina}
        onChangePorPagina={onChangePorPagina}
      />,
    );

    expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página 3' })).toBeDisabled();
    expect(screen.getByLabelText(/Filas por página/i)).toBeDisabled();
  });
});
