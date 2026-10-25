import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusTabs, type StatusTabItem } from './StatusTabs';

describe('StatusTabs', () => {
  const tabs: StatusTabItem<'todos' | 'activos' | 'inactivos'>[] = [
    { value: 'todos', label: 'Todos', count: 25 },
    { value: 'activos', label: 'Activos', count: 20 },
    { value: 'inactivos', label: 'Inactivos' },
  ];

  it('renderiza la lista de pestañas con aria-label y marca la seleccionada', () => {
    const onChange = vi.fn();
    render(
      <StatusTabs
        value="todos"
        onChange={onChange}
        tabs={tabs}
        aria-label="Filtro de socios"
      />,
    );

    const tablist = screen.getByRole('tablist', { name: 'Filtro de socios' });
    expect(tablist).toBeInTheDocument();

    const tabTodos = screen.getByRole('tab', { name: /^Todos/i });
    expect(tabTodos).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('25')).toBeInTheDocument();

    const tabActivos = screen.getByRole('tab', { name: /^Activos/i });
    expect(tabActivos).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(tabActivos);
    expect(onChange).toHaveBeenCalledWith('activos');
  });

  it('renderiza pestañas sin contador y aplica clases personalizadas', () => {
    const onChange = vi.fn();
    render(
      <StatusTabs
        value="inactivos"
        onChange={onChange}
        tabs={tabs}
        className="custom-tabs"
      />,
    );

    const tabInactivos = screen.getByRole('tab', { name: /^Inactivos/i });
    expect(tabInactivos).toHaveAttribute('aria-selected', 'true');
  });
});
